
import { FarmerProfile, WeatherData, RuleOutput, SignalLevel, AlertRecord, Season, CropStage, StageProgress, DecisionRule } from '../types';
import { RULES, DICTIONARY, Language, CROP_DURATIONS, STAGE_LIST } from '../constants';

export const suggestStage = (sowingDate: string, crop: string): CropStage => {
  const progress = getStageProgress(sowingDate, crop as any);
  return progress.currentStage;
};

export const getStageProgress = (sowingDate: string, crop: FarmerProfile['crop']): StageProgress => {
  const diffDays = Math.max(0, Math.floor((Date.now() - new Date(sowingDate).getTime()) / (1000 * 60 * 60 * 24)));
  const durations = CROP_DURATIONS[crop];
  
  let accumulatedDays = 0;
  for (let i = 0; i < STAGE_LIST.length; i++) {
    const stage = STAGE_LIST[i];
    const duration = durations[stage];
    if (diffDays < accumulatedDays + duration) {
      const daysInCurrent = diffDays - accumulatedDays;
      const nextStage = STAGE_LIST[i + 1] || null;
      return {
        currentStage: stage,
        percent: Math.min(100, (daysInCurrent / duration) * 100),
        daysInCurrent,
        nextStage,
        daysToNext: duration - daysInCurrent
      };
    }
    accumulatedDays += duration;
  }

  return {
    currentStage: CropStage.HARVEST,
    percent: 100,
    daysInCurrent: diffDays - (accumulatedDays - durations[CropStage.HARVEST]),
    nextStage: null,
    daysToNext: 0
  };
};

export const analyzeCropStatus = (
  profile: FarmerProfile,
  weather: WeatherData,
  lang: Language = 'en'
): RuleOutput => {
  const T = DICTIONARY[lang];
  const history = getAlertHistory();
  
  const checkIgnoredRecently = (key: string) => {
    const recentIgnore = history.find(h => 
      h.ruleKey === key && 
      h.actionTaken === 'NOT_TAKEN' && 
      (Date.now() - h.timestamp) < 24 * 60 * 60 * 1000
    );
    return !!recentIgnore;
  };

  // Seasonal Logic - Adjust thresholds
  let humidityThresholdModifier = 0;
  if (profile.season === Season.KHARIF) humidityThresholdModifier = 5;
  if (profile.season === Season.RABI) humidityThresholdModifier = -5;

  // PRIORITY LIST FOR RULES
  // 1. First find rules that apply to this crop
  const allRulesToProcess = RULES.filter(r => r.crop === profile.crop);

  // 2. Sort rules: Critical Emergency > Disease > Pests > Financial/Post-Harvest > Nutrient/Irrigation > Standard
  const sortedRules = [...allRulesToProcess].sort((a, b) => {
    const priority = (key: string) => {
      if (key.includes('FLOOD')) return 100;
      if (key.includes('DROUGHT')) return 95;
      if (key.includes('BLAST') || key.includes('RUST')) return 90;
      if (key.includes('PEST')) return 85;
      if (key.includes('FINANCIAL')) return 80;
      if (key.includes('POST_HARVEST')) return 78;
      if (key.includes('NUTRIENT')) return 75;
      if (key.includes('IRRIGATION')) return 72;
      if (key.includes('RAIN')) return 70;
      return 10;
    };
    return priority(b.ruleKey) - priority(a.ruleKey);
  });

  // Check for issues-based fallback immediately if no critical weather rules match
  const hasIssues = profile.observedIssues.length > 0;

  // 3. Process rules
  for (const rule of sortedRules) {
    if (checkIgnoredRecently(rule.ruleKey)) continue;

    const isTriggered = rule.condition(
      { 
        temp: weather.temp, 
        humidity: weather.humidity + humidityThresholdModifier, 
        rainForecast: weather.rainForecast 
      },
      profile.observedIssues
    );

    if (isTriggered) {
      // Stage check (global rules like FLOOD/DROUGHT don't always need stage match)
      const stageMatch = !rule.stage || rule.stage === profile.stage;
      if (!stageMatch && !rule.ruleKey.includes('FLOOD') && !rule.ruleKey.includes('DROUGHT')) {
        continue;
      }

      const key = rule.ruleKey;
      const confidence = weather.rainForecast > 40 || weather.humidity > 90 ? 'High' : 'Medium';
      
      const timeSensitivity = key.includes('RAIN') || key.includes('FLOOD') ? 
        T.IGNORE_RISK_HOURS.replace('{h}', '12-24') : 
        T.IGNORE_RISK_DAYS.replace('{d}', '2-3');

      const ruleLevel = (key.includes('ALERT') || key.includes('FLOOD') || key.includes('BLAST') || key.includes('RUST') || key.includes('FINANCIAL')) ? SignalLevel.ALERT : 
                        (key.includes('WARNING') || key.includes('PEST') || key.includes('NUTRIENT') || key.includes('IRRIGATION') || key.includes('POST_HARVEST')) ? SignalLevel.WARNING : 
                        SignalLevel.ALERT;

      // Extract details from T with potential replacement
      let reason = (T as any)[`${key}_REASON`] || T.DEFAULT_SAFE_REASON;
      reason = reason.replace('{issues}', profile.observedIssues.join(', '));
      reason = reason.replace('{temp}', weather.temp.toString());
      reason = reason.replace('{humidity}', weather.humidity.toString());
      reason = reason.replace('{stage}', profile.stage);

      let impact = (T as any)[`${key}_IMPACT`] || '';
      impact = impact.replace('{issues}', profile.observedIssues.join(', '));
      impact = impact.replace('{stage}', profile.stage);

      const action = (T as any)[`${key}_ACTION`] || T.DEFAULT_SAFE_ACTION;

      return {
        level: ruleLevel,
        reason,
        action,
        urgency: ruleLevel === SignalLevel.ALERT ? 
                 (lang === 'te' ? 'తక్షణమే' : (lang === 'hi' ? 'तुरंत' : 'Immediate')) : 
                 (lang === 'te' ? 'జాగ్రత్త' : (lang === 'hi' ? 'सावधानी' : 'Caution')),
        impact,
        consequence: (T as any)[`${key}_CONSEQUENCE`],
        timeSensitivity,
        confidence,
        isLowCost: rule.isLowCost || false,
        ruleKey: key
      };
    }
  }

  // 4. FIX: Default if issues are selected but no specific rule caught them (fallback)
  if (hasIssues) {
    return {
      level: SignalLevel.WARNING,
      reason: T.OBSERVED_ISSUE_REASON.replace('{issues}', profile.observedIssues.join(', ')),
      action: T.OBSERVED_ISSUE_ACTION,
      urgency: lang === 'te' ? 'జాగ్రత్త' : (lang === 'hi' ? 'सावधानी' : 'Caution'),
      impact: T.OBSERVED_ISSUE_IMPACT.replace('{issues}', profile.observedIssues.join(', ')),
      consequence: T.OBSERVED_ISSUE_CONSEQUENCE,
      confidence: 'Medium',
      isLowCost: true,
      ruleKey: 'OBSERVED_ISSUES'
    };
  }

  // Final check for a Financial Tip (not based on specific conditions but stage/timing)
  // Let's add a recurring financial check for harvest/sowing
  if (profile.stage === CropStage.HARVEST || profile.stage === CropStage.SOWING) {
     return {
        level: SignalLevel.WARNING,
        reason: T.FINANCIAL_ALERT_REASON,
        action: T.FINANCIAL_ALERT_ACTION,
        urgency: 'Institutional Support',
        impact: T.FINANCIAL_ALERT_IMPACT,
        consequence: T.FINANCIAL_ALERT_CONSEQUENCE,
        confidence: 'High',
        isLowCost: true,
        ruleKey: 'FINANCIAL_ALERT'
     };
  }

  return {
    level: SignalLevel.SAFE,
    reason: T.DEFAULT_SAFE_REASON,
    action: T.DEFAULT_SAFE_ACTION,
    urgency: lang === 'te' ? 'సాధారణం' : (lang === 'hi' ? 'सामान्य' : 'Normal'),
    confidence: 'High',
    isLowCost: true
  };
};

export const getActiveRisks = (
  profile: FarmerProfile,
  weather: WeatherData,
  lang: Language = 'en'
): RuleOutput[] => {
  const T = DICTIONARY[lang];
  const activeRisks: RuleOutput[] = [];

  let humidityThresholdModifier = 0;
  if (profile.season === Season.KHARIF) humidityThresholdModifier = 5;
  if (profile.season === Season.RABI) humidityThresholdModifier = -5;

  for (const rule of RULES) {
    if (rule.crop !== profile.crop) continue;

    const isTriggered = rule.condition(
      { 
        temp: weather.temp, 
        humidity: weather.humidity + humidityThresholdModifier, 
        rainForecast: weather.rainForecast 
      },
      profile.observedIssues
    );

    if (isTriggered) {
      const key = rule.ruleKey;
      activeRisks.push({
        level: (key.includes('ALERT') || key.includes('FLOOD') || key.includes('BLAST') || key.includes('RUST')) ? SignalLevel.ALERT : SignalLevel.WARNING,
        reason: (T as any)[`${key}_REASON`] || T.DEFAULT_SAFE_REASON,
        action: (T as any)[`${key}_ACTION`] || T.DEFAULT_SAFE_ACTION,
        urgency: key.includes('ALERT') ? 'Immediate' : 'Caution',
        impact: (T as any)[`${key}_IMPACT`],
        confidence: 'High',
        isLowCost: rule.isLowCost || false,
        ruleKey: key
      });
    }
  }

  // Add issue fallback as a risk if present
  if (profile.observedIssues.length > 0 && !activeRisks.find(r => r.ruleKey === 'OBSERVED_ISSUES')) {
     activeRisks.push({
        level: SignalLevel.WARNING,
        reason: T.OBSERVED_ISSUE_REASON.replace('{issues}', profile.observedIssues.join(', ')),
        action: T.OBSERVED_ISSUE_ACTION,
        urgency: 'Field Risk',
        impact: T.OBSERVED_ISSUE_IMPACT.replace('{issues}', profile.observedIssues.join(', ')),
        confidence: 'Medium',
        isLowCost: true,
        ruleKey: 'OBSERVED_ISSUES'
     });
  }

  const priorityOrder = { [SignalLevel.ALERT]: 3, [SignalLevel.WARNING]: 2, [SignalLevel.SAFE]: 1 };
  return activeRisks
    .sort((a, b) => priorityOrder[b.level] - priorityOrder[a.level])
    .slice(0, 3); 
};

const HISTORY_KEY = 'samarth_kisan_history';

export const saveAlertToHistory = (record: AlertRecord) => {
  const history = getAlertHistory();
  const isDuplicate = history.some(h => 
    h.crop === record.crop && 
    h.level === record.level && 
    h.ruleKey === record.ruleKey &&
    (Date.now() - h.timestamp) < 6 * 60 * 60 * 1000 
  );

  if (!isDuplicate) {
    const newHistory = [{...record, actionTaken: 'PENDING'}, ...history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    localStorage.setItem('last_alert', JSON.stringify(record));
  }
};

export const updateActionStatus = (id: string, status: 'TAKEN' | 'NOT_TAKEN') => {
  const history = getAlertHistory();
  const updated = history.map(h => h.id === id ? { ...h, actionTaken: status } : h);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const updateFeedback = (id: string) => {
  const history = getAlertHistory();
  const updated = history.map(h => h.id === id ? { ...h, feedbackGiven: true, actionTaken: 'TAKEN' as const } : h);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const getAlertHistory = (): AlertRecord[] => {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};
