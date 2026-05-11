export type Lang = 'de' | 'ro' | 'ar' | 'pl' | 'en';

export const langNames: Record<Lang, string> = {
  de: 'Deutsch',
  ro: 'Romana',
  ar: 'العربية',
  pl: 'Polski',
  en: 'English',
};

export const langLocale: Record<Lang, string> = {
  de: 'de-DE',
  ro: 'ro-RO',
  ar: 'ar-SA',
  pl: 'pl-PL',
  en: 'en-GB',
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
  upcomingAssignments: string;
  noUpcomingAssignments: string;
  checkIn: string;
  checkOut: string;
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
  otherDate: string;
  pickDate: string;
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
  sickConfirmTitle: string;
  sickConfirmMessage: string;
  sickConfirmYes: string;
  sickConfirmNo: string;
  youAreSick: string;
  sickSince: string;
  sickReportedFor: string;
  sickReportedFrom: string;
  sickUntil: string;
  addEndDate: string;
  endDate: string;
  at: string;
  clock: string;
  allowNotifications: string;
  allowNotificationsDesc: string;
  enableNotifications: string;
  enablingNotifications: string;
  later: string;
  notificationsActive: string;
  assignmentStarted: string;
  notCheckedIn: string;
  checkInNow: string;
};

const translations: Record<Lang, TranslationKeys> = {
  de: {
    goodMorning: 'Guten Morgen',
    goodDay: 'Guten Tag',
    goodEvening: 'Guten Abend',
    todaysAssignment: 'Dein heutiger Einsatz',
    noAssignmentToday: 'Heute kein Einsatz geplant',
    upcomingAssignments: 'Deine kommenden Einsätze',
    noUpcomingAssignments: 'Keine kommenden Einsätze',
    checkIn: 'Einchecken',
    checkOut: 'Auschecken',
    checkedIn: 'Eingecheckt',
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
    otherDate: 'Anderes Datum',
    pickDate: 'Datum wählen',
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
    sickConfirmTitle: 'Bist du sicher?',
    sickConfirmMessage: 'Du bist für einen Einsatz eingetragen. Wenn du dich krank meldest, muss dein Chef Ersatz finden.',
    sickConfirmYes: 'Ja, krank melden',
    sickConfirmNo: 'Abbrechen',
    youAreSick: 'Du bist krankgemeldet',
    sickSince: 'Krank seit',
    sickReportedFor: 'Krankgemeldet für',
    sickReportedFrom: 'Krankgemeldet von',
    sickUntil: 'bis',
    addEndDate: 'Enddatum hinzufügen',
    endDate: 'Letzter Krankheitstag',
    at: 'um',
    clock: 'Uhr',
    allowNotifications: 'Benachrichtigungen erlauben',
    allowNotificationsDesc: 'Erhalte sofort Bescheid wenn du einen neuen Einsatz bekommst.',
    enableNotifications: 'Ja, aktivieren',
    enablingNotifications: 'Wird aktiviert...',
    later: 'Später',
    notificationsActive: 'Benachrichtigungen aktiv — du wirst bei neuen Einsätzen informiert',
    assignmentStarted: 'Einsatz hat begonnen',
    notCheckedIn: 'Du hast dich noch nicht eingecheckt',
    checkInNow: 'Jetzt einchecken',
  },
  ro: {
    goodMorning: 'Buna dimineata',
    goodDay: 'Buna ziua',
    goodEvening: 'Buna seara',
    todaysAssignment: 'Sarcina ta de azi',
    noAssignmentToday: 'Nicio sarcina planificata pentru azi',
    upcomingAssignments: 'Sarcinile tale viitoare',
    noUpcomingAssignments: 'Nicio sarcina viitoare',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
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
    otherDate: 'Alta data',
    pickDate: 'Alege data',
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
    sickConfirmTitle: 'Esti sigur?',
    sickConfirmMessage: 'Esti asignat pentru o sarcina. Daca te declari bolnav, seful va trebui sa gaseasca un inlocuitor.',
    sickConfirmYes: 'Da, declar bolnav',
    sickConfirmNo: 'Anuleaza',
    youAreSick: 'Esti in concediu medical',
    sickSince: 'Bolnav din',
    sickReportedFor: 'Declarat bolnav pentru',
    sickReportedFrom: 'Declarat bolnav de la',
    sickUntil: 'pana la',
    addEndDate: 'Adauga data de sfarsit',
    endDate: 'Ultima zi de boala',
    at: 'la',
    clock: '',
    allowNotifications: 'Permite notificari',
    allowNotificationsDesc: 'Primesti imediat o notificare cand ai o noua sarcina.',
    enableNotifications: 'Da, activeaza',
    enablingNotifications: 'Se activeaza...',
    later: 'Mai tarziu',
    notificationsActive: 'Notificari active — vei fi informat despre noile sarcini',
    assignmentStarted: 'Sarcina a inceput',
    notCheckedIn: 'Nu ai facut check-in inca',
    checkInNow: 'Fa check-in acum',
  },
  ar: {
    goodMorning: 'صباح الخير',
    goodDay: 'مرحبا',
    goodEvening: 'مساء الخير',
    todaysAssignment: 'مهمتك اليوم',
    noAssignmentToday: 'لا توجد مهمة مخططة اليوم',
    upcomingAssignments: 'مهماتك القادمة',
    noUpcomingAssignments: 'لا توجد مهمات قادمة',
    checkIn: 'تسجيل الحضور',
    checkOut: 'تسجيل الانصراف',
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
    otherDate: 'تاريخ آخر',
    pickDate: 'اختر التاريخ',
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
    sickConfirmTitle: 'هل أنت متأكد؟',
    sickConfirmMessage: 'لديك مهمة مسجلة. إذا أبلغت عن مرضك، سيحتاج المدير لإيجاد بديل.',
    sickConfirmYes: 'نعم، إبلاغ عن مرض',
    sickConfirmNo: 'إلغاء',
    youAreSick: 'أنت مبلغ عن مرضك',
    sickSince: 'مريض منذ',
    sickReportedFor: 'مبلغ عن مرضك ليوم',
    sickReportedFrom: 'مبلغ عن مرضك من',
    sickUntil: 'حتى',
    addEndDate: 'أضف تاريخ الانتهاء',
    endDate: 'آخر يوم مرضي',
    at: 'في',
    clock: '',
    allowNotifications: 'السماح بالإشعارات',
    allowNotificationsDesc: 'احصل على إشعار فوري عند تعيين مهمة جديدة لك.',
    enableNotifications: 'نعم، فعّل',
    enablingNotifications: 'جارٍ التفعيل...',
    later: 'لاحقاً',
    notificationsActive: 'الإشعارات نشطة — ستُبلَّغ بالمهام الجديدة',
    assignmentStarted: 'بدأت المهمة',
    notCheckedIn: 'لم تسجل حضورك بعد',
    checkInNow: 'سجل حضورك الآن',
  },
  pl: {
    goodMorning: 'Dzien dobry',
    goodDay: 'Dzien dobry',
    goodEvening: 'Dobry wieczor',
    todaysAssignment: 'Twoje dzisiejsze zadanie',
    noAssignmentToday: 'Brak zaplanowanych zadan na dzis',
    upcomingAssignments: 'Twoje nadchodzace zadania',
    noUpcomingAssignments: 'Brak nadchodzacych zadan',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
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
    otherDate: 'Inna data',
    pickDate: 'Wybierz date',
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
    sickConfirmTitle: 'Czy jestes pewny?',
    sickConfirmMessage: 'Masz przypisane zadanie. Jesli zglosisz chorobe, szef bedzie musial znalezc zastepstwo.',
    sickConfirmYes: 'Tak, zglos chorobe',
    sickConfirmNo: 'Anuluj',
    youAreSick: 'Jestes na zwolnieniu chorobowym',
    sickSince: 'Chory od',
    sickReportedFor: 'Zgloszona choroba na',
    sickReportedFrom: 'Zgloszona choroba od',
    sickUntil: 'do',
    addEndDate: 'Dodaj date konca',
    endDate: 'Ostatni dzien choroby',
    at: 'o',
    clock: '',
    allowNotifications: 'Zezwol na powiadomienia',
    allowNotificationsDesc: 'Otrzymuj powiadomienie gdy masz nowe zadanie.',
    enableNotifications: 'Tak, wlacz',
    enablingNotifications: 'Wlaczanie...',
    later: 'Pozniej',
    notificationsActive: 'Powiadomienia aktywne — bedziesz informowany o nowych zadaniach',
    assignmentStarted: 'Zadanie sie rozpoczelo',
    notCheckedIn: 'Nie zrobiles jeszcze check-ina',
    checkInNow: 'Zrob check-in teraz',
  },
  en: {
    goodMorning: 'Good morning',
    goodDay: 'Good day',
    goodEvening: 'Good evening',
    todaysAssignment: 'Your assignment today',
    noAssignmentToday: 'No assignment scheduled for today',
    upcomingAssignments: 'Your upcoming assignments',
    noUpcomingAssignments: 'No upcoming assignments',
    checkIn: 'Check in',
    checkOut: 'Check out',
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
    otherDate: 'Other date',
    pickDate: 'Pick a date',
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
    sickConfirmTitle: 'Are you sure?',
    sickConfirmMessage: 'You are assigned to a shift. If you report sick, your boss will need to find a replacement.',
    sickConfirmYes: 'Yes, report sick',
    sickConfirmNo: 'Cancel',
    youAreSick: 'You are reported sick',
    sickSince: 'Sick since',
    sickReportedFor: 'Reported sick for',
    sickReportedFrom: 'Reported sick from',
    sickUntil: 'until',
    addEndDate: 'Add end date',
    endDate: 'Last sick day',
    at: 'at',
    clock: '',
    allowNotifications: 'Allow notifications',
    allowNotificationsDesc: 'Get notified immediately when you have a new assignment.',
    enableNotifications: 'Yes, enable',
    enablingNotifications: 'Enabling...',
    later: 'Later',
    notificationsActive: 'Notifications active — you will be informed about new assignments',
    assignmentStarted: 'Assignment has started',
    notCheckedIn: 'You have not checked in yet',
    checkInNow: 'Check in now',
  },
};

export function t(lang: Lang, key: keyof TranslationKeys): string {
  return translations[lang]?.[key] || translations.de[key] || key;
}

export function isRTL(lang: Lang): boolean {
  return lang === 'ar';
}
