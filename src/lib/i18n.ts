export type Lang = 'de' | 'ro' | 'ar' | 'pl' | 'en';

export const langNames: Record<Lang, string> = {
  de: 'Deutsch',
  ro: 'Romana',
  ar: 'العربية',
  pl: 'Polski',
  en: 'English',
};

export const langFlags: Record<Lang, string> = {
  de: '🇩🇪',
  ro: '🇷🇴',
  ar: '🇸🇦',
  pl: '🇵🇱',
  en: '🇬🇧',
};

type TranslationKeys = {
  goodMorning: string;
  goodDay: string;
  goodEvening: string;
  todaysAssignment: string;
  noAssignmentToday: string;
  checkIn: string;
  checkedIn: string;
  sickLeave: string;
  logOut: string;
  notifications: string;
  noNotifications: string;
  markAllRead: string;
  newAssignment: string;
  replacementRequest: string;
  canYouCover: string;
  yesICan: string;
  no: string;
  bossInformed: string;
  showRoute: string;
  sickReport: string;
  today: string;
  tomorrow: string;
  reason: string;
  reasonOptional: string;
  sendSickReport: string;
  sending: string;
  reported: string;
  bossInformedGetWell: string;
  backToOverview: string;
  back: string;
  login: string;
  email: string;
  password: string;
  invalidCredentials: string;
  setPassword: string;
  chooseOwnPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordMinLength: string;
  passwordsDontMatch: string;
  savePassword: string;
  saving: string;
  showPassword: string;
};

const translations: Record<Lang, TranslationKeys> = {
  de: {
    goodMorning: 'Guten Morgen',
    goodDay: 'Guten Tag',
    goodEvening: 'Guten Abend',
    todaysAssignment: 'Dein heutiger Einsatz',
    noAssignmentToday: 'Heute kein Einsatz geplant',
    checkIn: 'Einchecken',
    checkedIn: 'Eingechekt',
    sickLeave: 'Krank melden',
    logOut: 'Abmelden',
    notifications: 'Nachrichten',
    noNotifications: 'Keine neuen Nachrichten',
    markAllRead: 'Alle gelesen',
    newAssignment: 'Neuer Einsatz',
    replacementRequest: 'Einspringen?',
    canYouCover: 'ist krank. Kannst du heute einspringen?',
    yesICan: 'Ja, ich komme',
    no: 'Nein',
    bossInformed: 'Chef wurde informiert!',
    showRoute: 'Route anzeigen',
    sickReport: 'Krankmeldung',
    today: 'Heute',
    tomorrow: 'Morgen',
    reason: 'Grund',
    reasonOptional: 'Grund (optional)',
    sendSickReport: 'Krankmeldung absenden',
    sending: 'Wird gesendet...',
    reported: 'Gemeldet',
    bossInformedGetWell: 'Dein Chef wurde informiert.\nGute Besserung!',
    backToOverview: 'Zurück zur Übersicht',
    back: 'Zurück',
    login: 'Anmelden',
    email: 'E-Mail',
    password: 'Passwort',
    invalidCredentials: 'Ungültige Anmeldedaten',
    setPassword: 'Passwort setzen',
    chooseOwnPassword: 'Bitte wähle ein eigenes Passwort für deinen Account',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    passwordMinLength: 'Passwort muss mindestens 6 Zeichen haben',
    passwordsDontMatch: 'Passwörter stimmen nicht überein',
    savePassword: 'Passwort speichern',
    saving: 'Wird gespeichert...',
    showPassword: 'Passwort anzeigen',
  },
  ro: {
    goodMorning: 'Buna dimineata',
    goodDay: 'Buna ziua',
    goodEvening: 'Buna seara',
    todaysAssignment: 'Sarcina ta de azi',
    noAssignmentToday: 'Nicio sarcina planificata pentru azi',
    checkIn: 'Check-in',
    checkedIn: 'Check-in efectuat',
    sickLeave: 'Concediu medical',
    logOut: 'Deconectare',
    notifications: 'Notificari',
    noNotifications: 'Nicio notificare noua',
    markAllRead: 'Toate citite',
    newAssignment: 'Sarcina noua',
    replacementRequest: 'Poti inlocui?',
    canYouCover: 'este bolnav. Poti inlocui azi?',
    yesICan: 'Da, vin',
    no: 'Nu',
    bossInformed: 'Sefull a fost informat!',
    showRoute: 'Arata ruta',
    sickReport: 'Raport medical',
    today: 'Azi',
    tomorrow: 'Maine',
    reason: 'Motiv',
    reasonOptional: 'Motiv (optional)',
    sendSickReport: 'Trimite raportul medical',
    sending: 'Se trimite...',
    reported: 'Raportat',
    bossInformedGetWell: 'Sefull tau a fost informat.\nSanatate!',
    backToOverview: 'Inapoi la prezentare generala',
    back: 'Inapoi',
    login: 'Autentificare',
    email: 'E-mail',
    password: 'Parola',
    invalidCredentials: 'Date de autentificare invalide',
    setPassword: 'Seteaza parola',
    chooseOwnPassword: 'Alege o parola proprie pentru contul tau',
    newPassword: 'Parola noua',
    confirmPassword: 'Confirma parola',
    passwordMinLength: 'Parola trebuie sa aiba cel putin 6 caractere',
    passwordsDontMatch: 'Parolele nu coincid',
    savePassword: 'Salveaza parola',
    saving: 'Se salveaza...',
    showPassword: 'Arata parola',
  },
  ar: {
    goodMorning: 'صباح الخير',
    goodDay: 'مرحبا',
    goodEvening: 'مساء الخير',
    todaysAssignment: 'مهمتك اليوم',
    noAssignmentToday: 'لا توجد مهمة مخططة اليوم',
    checkIn: 'تسجيل الحضور',
    checkedIn: 'تم تسجيل الحضور',
    sickLeave: 'إبلاغ عن مرض',
    logOut: 'تسجيل الخروج',
    notifications: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات جديدة',
    markAllRead: 'قراءة الكل',
    newAssignment: 'مهمة جديدة',
    replacementRequest: 'هل يمكنك التعويض؟',
    canYouCover: 'مريض. هل يمكنك التعويض اليوم؟',
    yesICan: 'نعم، سآتي',
    no: 'لا',
    bossInformed: 'تم إبلاغ المدير!',
    showRoute: 'عرض المسار',
    sickReport: 'تقرير مرضي',
    today: 'اليوم',
    tomorrow: 'غداً',
    reason: 'السبب',
    reasonOptional: 'السبب (اختياري)',
    sendSickReport: 'إرسال التقرير المرضي',
    sending: 'جارٍ الإرسال...',
    reported: 'تم الإبلاغ',
    bossInformedGetWell: 'تم إبلاغ مديرك.\nشفاك الله!',
    backToOverview: 'العودة للرئيسية',
    back: 'رجوع',
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    setPassword: 'تعيين كلمة المرور',
    chooseOwnPassword: 'يرجى اختيار كلمة مرور خاصة بك',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    passwordMinLength: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
    savePassword: 'حفظ كلمة المرور',
    saving: 'جارٍ الحفظ...',
    showPassword: 'إظهار كلمة المرور',
  },
  pl: {
    goodMorning: 'Dzien dobry',
    goodDay: 'Dzien dobry',
    goodEvening: 'Dobry wieczor',
    todaysAssignment: 'Twoje dzisiejsze zadanie',
    noAssignmentToday: 'Brak zaplanowanych zadan na dzis',
    checkIn: 'Check-in',
    checkedIn: 'Zalogowano',
    sickLeave: 'Zglos chorobe',
    logOut: 'Wyloguj',
    notifications: 'Powiadomienia',
    noNotifications: 'Brak nowych powiadomien',
    markAllRead: 'Wszystkie przeczytane',
    newAssignment: 'Nowe zadanie',
    replacementRequest: 'Mozesz zastapic?',
    canYouCover: 'jest chory. Mozesz dzis zastapic?',
    yesICan: 'Tak, przyjde',
    no: 'Nie',
    bossInformed: 'Szef zostal poinformowany!',
    showRoute: 'Pokaz trase',
    sickReport: 'Zgloszenie chorobowe',
    today: 'Dzis',
    tomorrow: 'Jutro',
    reason: 'Powod',
    reasonOptional: 'Powod (opcjonalnie)',
    sendSickReport: 'Wyslij zgloszenie chorobowe',
    sending: 'Wysylanie...',
    reported: 'Zgloszono',
    bossInformedGetWell: 'Twoj szef zostal poinformowany.\nWyzdrowien!',
    backToOverview: 'Wroc do przegladu',
    back: 'Wroc',
    login: 'Zaloguj sie',
    email: 'E-mail',
    password: 'Haslo',
    invalidCredentials: 'Nieprawidlowe dane logowania',
    setPassword: 'Ustaw haslo',
    chooseOwnPassword: 'Wybierz wlasne haslo do swojego konta',
    newPassword: 'Nowe haslo',
    confirmPassword: 'Potwierdz haslo',
    passwordMinLength: 'Haslo musi miec co najmniej 6 znakow',
    passwordsDontMatch: 'Hasla sie nie zgadzaja',
    savePassword: 'Zapisz haslo',
    saving: 'Zapisywanie...',
    showPassword: 'Pokaz haslo',
  },
  en: {
    goodMorning: 'Good morning',
    goodDay: 'Good day',
    goodEvening: 'Good evening',
    todaysAssignment: 'Your assignment today',
    noAssignmentToday: 'No assignment scheduled for today',
    checkIn: 'Check in',
    checkedIn: 'Checked in',
    sickLeave: 'Report sick',
    logOut: 'Log out',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    markAllRead: 'Mark all read',
    newAssignment: 'New assignment',
    replacementRequest: 'Can you cover?',
    canYouCover: 'is sick. Can you cover today?',
    yesICan: 'Yes, I can',
    no: 'No',
    bossInformed: 'Boss has been informed!',
    showRoute: 'Show route',
    sickReport: 'Sick report',
    today: 'Today',
    tomorrow: 'Tomorrow',
    reason: 'Reason',
    reasonOptional: 'Reason (optional)',
    sendSickReport: 'Submit sick report',
    sending: 'Sending...',
    reported: 'Reported',
    bossInformedGetWell: 'Your boss has been informed.\nGet well soon!',
    backToOverview: 'Back to overview',
    back: 'Back',
    login: 'Log in',
    email: 'Email',
    password: 'Password',
    invalidCredentials: 'Invalid credentials',
    setPassword: 'Set password',
    chooseOwnPassword: 'Please choose your own password for your account',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    passwordMinLength: 'Password must be at least 6 characters',
    passwordsDontMatch: 'Passwords do not match',
    savePassword: 'Save password',
    saving: 'Saving...',
    showPassword: 'Show password',
  },
};

export function t(lang: Lang, key: keyof TranslationKeys): string {
  return translations[lang]?.[key] || translations.de[key] || key;
}

export function isRTL(lang: Lang): boolean {
  return lang === 'ar';
}
