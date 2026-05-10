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

// Locale string for toLocaleDateString / toLocaleTimeString
export const langLocale: Record<Lang, string> = {
  de: 'de-DE',
  ro: 'ro-RO',
  ar: 'ar-SA',
  pl: 'pl-PL',
  en: 'en-GB',
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
  at: string;
  clock: string;
  // Push notifications
  notifAllowTitle: string;
  notifAllowDesc: string;
  notifActivating: string;
  notifActivate: string;
  notifLater: string;
  notifActive: string;
  // Check-in/out status
  checkedInAt: string;
  checkOut: string;
  // GPS / Check-in flow
  checkInTitle: string;
  gpsChecking: string;
  gpsLocating: string;
  gpsGeocoding: string;
  gpsConfirmed: string;
  gpsDistanceFrom: string;
  gpsNotVerified: string;
  gpsTooFar: string;
  gpsTooFarDesc: string;
  gpsMustBeOnSite: string;
  gpsAccessDenied: string;
  gpsUnavailable: string;
  cameraError: string;
  checkInError: string;
  retake: string;
  retry: string;
  takePhoto: string;
  reviewPhoto: string;
  reviewPhotoDesc: string;
  checkInConfirm: string;
  checkingIn: string;
  uploadingPhoto: string;
  checkedInSuccess: string;
  gpsVerified: string;
  // Check-out flow
  checkOutTitle: string;
  checkedInLabel: string;
  nowLabel: string;
  durationLabel: string;
  proofPhoto: string;
  proofPhotoDesc: string;
  photoCheckout: string;
  takeWorkPhoto: string;
  reviewWorkDesc: string;
  checkingOut: string;
  checkOutSuccess: string;
  durationPrefix: string;
  recordedInBilling: string;
  checkOutError: string;
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
    at: 'um',
    clock: 'Uhr',
    notifAllowTitle: 'Benachrichtigungen erlauben',
    notifAllowDesc: 'Erhalte sofort Bescheid wenn du einen neuen Einsatz bekommst.',
    notifActivating: 'Wird aktiviert...',
    notifActivate: 'Ja, aktivieren',
    notifLater: 'Später',
    notifActive: 'Benachrichtigungen aktiv — du wirst bei neuen Einsätzen informiert',
    checkedInAt: 'Eingecheckt um',
    checkOut: 'Auschecken',
    checkInTitle: 'Einchecken',
    gpsChecking: 'Standort wird geprüft...',
    gpsLocating: 'GPS wird ermittelt...',
    gpsGeocoding: 'Adresse wird verifiziert...',
    gpsConfirmed: 'Standort bestätigt',
    gpsDistanceFrom: 'vom Objekt entfernt',
    gpsNotVerified: 'Adresse konnte nicht verifiziert werden',
    gpsTooFar: 'Zu weit entfernt',
    gpsTooFarDesc: 'Erlaubt: bis',
    gpsMustBeOnSite: 'Du musst vor Ort sein um einzuchecken.',
    gpsAccessDenied: 'GPS-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.',
    gpsUnavailable: 'GPS nicht verfügbar. Bitte erneut versuchen.',
    cameraError: 'Kamera konnte nicht geöffnet werden. Bitte Berechtigung erteilen.',
    checkInError: 'Fehler beim Einchecken',
    retake: 'Nochmal',
    retry: 'Erneut versuchen',
    takePhoto: 'Gebäude fotografieren',
    reviewPhoto: 'Foto prüfen',
    reviewPhotoDesc: 'Ist das Gebäude gut erkennbar?',
    checkInConfirm: 'Einchecken',
    checkingIn: 'Einchecken...',
    uploadingPhoto: 'Foto wird hochgeladen',
    checkedInSuccess: 'Eingecheckt!',
    gpsVerified: 'verifiziert',
    checkOutTitle: 'Auschecken',
    checkedInLabel: 'Eingecheckt',
    nowLabel: 'Jetzt',
    durationLabel: 'Dauer',
    proofPhoto: 'Nachweis-Foto',
    proofPhotoDesc: 'Fotografiere den gereinigten Bereich als Nachweis der erledigten Arbeit.',
    photoCheckout: 'Foto & Auschecken',
    takeWorkPhoto: 'Erledigten Bereich fotografieren',
    reviewWorkDesc: 'Ist die erledigte Arbeit gut erkennbar?',
    checkingOut: 'Auschecken...',
    checkOutSuccess: 'Fertig!',
    durationPrefix: 'Dauer: ',
    recordedInBilling: 'Wird in der Abrechnung erfasst',
    checkOutError: 'Fehler beim Auschecken',
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
    bossInformed: 'Seful a fost informat!',
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
    bossInformedGetWell: 'Seful tau a fost informat.\nSanatate!',
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
    at: 'la',
    clock: '',
    notifAllowTitle: 'Permite notificari',
    notifAllowDesc: 'Primeste imediat cand ai o sarcina noua.',
    notifActivating: 'Se activeaza...',
    notifActivate: 'Da, activeaza',
    notifLater: 'Mai tarziu',
    notifActive: 'Notificari active — vei fi anuntat la sarcini noi',
    checkedInAt: 'Check-in la',
    checkOut: 'Check-out',
    checkInTitle: 'Check-in',
    gpsChecking: 'Se verifica locatia...',
    gpsLocating: 'Se determina GPS-ul...',
    gpsGeocoding: 'Se verifica adresa...',
    gpsConfirmed: 'Locatie confirmata',
    gpsDistanceFrom: 'de la obiect',
    gpsNotVerified: 'Adresa nu a putut fi verificata',
    gpsTooFar: 'Prea departe',
    gpsTooFarDesc: 'Permis: pana la',
    gpsMustBeOnSite: 'Trebuie sa fii la fata locului pentru check-in.',
    gpsAccessDenied: 'Acces GPS refuzat. Permiteti in setarile browserului.',
    gpsUnavailable: 'GPS indisponibil. Incercati din nou.',
    cameraError: 'Camera nu a putut fi deschisa. Acordati permisiunea.',
    checkInError: 'Eroare la check-in',
    retake: 'Reface',
    retry: 'Incearca din nou',
    takePhoto: 'Fotografiaza cladirea',
    reviewPhoto: 'Verifica fotografia',
    reviewPhotoDesc: 'Este cladirea clar vizibila?',
    checkInConfirm: 'Check-in',
    checkingIn: 'Se face check-in...',
    uploadingPhoto: 'Se incarca fotografia',
    checkedInSuccess: 'Check-in efectuat!',
    gpsVerified: 'verificat',
    checkOutTitle: 'Check-out',
    checkedInLabel: 'Check-in',
    nowLabel: 'Acum',
    durationLabel: 'Durata',
    proofPhoto: 'Foto dovada',
    proofPhotoDesc: 'Fotografiaza zona curatata ca dovada a lucrarii efectuate.',
    photoCheckout: 'Foto & Check-out',
    takeWorkPhoto: 'Fotografiaza zona finalizata',
    reviewWorkDesc: 'Este munca efectuata clar vizibila?',
    checkingOut: 'Se face check-out...',
    checkOutSuccess: 'Gata!',
    durationPrefix: 'Durata: ',
    recordedInBilling: 'Va fi inregistrat in salarizare',
    checkOutError: 'Eroare la check-out',
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
    at: 'في',
    clock: '',
    notifAllowTitle: 'السماح بالإشعارات',
    notifAllowDesc: 'احصل على إشعار فوري عند تعيين مهمة جديدة لك.',
    notifActivating: 'جارٍ التفعيل...',
    notifActivate: 'نعم، فعّل',
    notifLater: 'لاحقاً',
    notifActive: 'الإشعارات نشطة — ستُعلَم بالمهام الجديدة',
    checkedInAt: 'تم تسجيل الحضور في',
    checkOut: 'تسجيل المغادرة',
    checkInTitle: 'تسجيل الحضور',
    gpsChecking: 'جارٍ التحقق من الموقع...',
    gpsLocating: 'جارٍ تحديد GPS...',
    gpsGeocoding: 'جارٍ التحقق من العنوان...',
    gpsConfirmed: 'تم تأكيد الموقع',
    gpsDistanceFrom: 'من الموقع',
    gpsNotVerified: 'تعذر التحقق من العنوان',
    gpsTooFar: 'أنت بعيد جداً',
    gpsTooFarDesc: 'المسموح: حتى',
    gpsMustBeOnSite: 'يجب أن تكون في الموقع لتسجيل الحضور.',
    gpsAccessDenied: 'تم رفض الوصول إلى GPS. يرجى السماح في إعدادات المتصفح.',
    gpsUnavailable: 'GPS غير متوفر. حاول مرة أخرى.',
    cameraError: 'تعذر فتح الكاميرا. يرجى منح الإذن.',
    checkInError: 'خطأ أثناء تسجيل الحضور',
    retake: 'إعادة التصوير',
    retry: 'حاول مجدداً',
    takePhoto: 'تصوير المبنى',
    reviewPhoto: 'مراجعة الصورة',
    reviewPhotoDesc: 'هل المبنى واضح في الصورة؟',
    checkInConfirm: 'تسجيل الحضور',
    checkingIn: 'جارٍ تسجيل الحضور...',
    uploadingPhoto: 'جارٍ رفع الصورة',
    checkedInSuccess: 'تم تسجيل الحضور!',
    gpsVerified: 'موثّق',
    checkOutTitle: 'تسجيل المغادرة',
    checkedInLabel: 'الحضور',
    nowLabel: 'الآن',
    durationLabel: 'المدة',
    proofPhoto: 'صورة إثبات',
    proofPhotoDesc: 'صوّر المنطقة التي تم تنظيفها كدليل على إتمام العمل.',
    photoCheckout: 'صورة ومغادرة',
    takeWorkPhoto: 'تصوير المنطقة المنجزة',
    reviewWorkDesc: 'هل العمل المنجز واضح في الصورة؟',
    checkingOut: 'جارٍ تسجيل المغادرة...',
    checkOutSuccess: 'تم!',
    durationPrefix: 'المدة: ',
    recordedInBilling: 'سيتم تسجيله في كشف الرواتب',
    checkOutError: 'خطأ أثناء تسجيل المغادرة',
  },
  pl: {
    goodMorning: 'Dzien dobry',
    goodDay: 'Dzien dobry',
    goodEvening: 'Dobry wieczor',
    todaysAssignment: 'Twoje dzisiejsze zadanie',
    noAssignmentToday: 'Brak zaplanowanych zadan na dzis',
    upcomingAssignments: 'Twoje nadchodzace zadania',
    noUpcomingAssignments: 'Brak nadchodzacych zadan',
    checkIn: 'Zamelduj sie',
    checkedIn: 'Zameldowany',
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
    at: 'o',
    clock: '',
    notifAllowTitle: 'Zezwol na powiadomienia',
    notifAllowDesc: 'Otrzymuj natychmiastowe powiadomienia o nowych zadaniach.',
    notifActivating: 'Aktywowanie...',
    notifActivate: 'Tak, wlacz',
    notifLater: 'Pozniej',
    notifActive: 'Powiadomienia aktywne — bedziesz informowany o nowych zadaniach',
    checkedInAt: 'Zameldowano o',
    checkOut: 'Wymelduj sie',
    checkInTitle: 'Zameldowanie',
    gpsChecking: 'Sprawdzanie lokalizacji...',
    gpsLocating: 'Ustalanie GPS...',
    gpsGeocoding: 'Weryfikacja adresu...',
    gpsConfirmed: 'Lokalizacja potwierdzona',
    gpsDistanceFrom: 'od obiektu',
    gpsNotVerified: 'Adres nie mogl zostac zweryfikowany',
    gpsTooFar: 'Zbyt daleko',
    gpsTooFarDesc: 'Dozwolone: do',
    gpsMustBeOnSite: 'Musisz byc na miejscu, aby sie zameldowac.',
    gpsAccessDenied: 'Dostep do GPS odrzucony. Zezwol w ustawieniach przegladarki.',
    gpsUnavailable: 'GPS niedostepny. Sprobuj ponownie.',
    cameraError: 'Nie mozna otworzyc kamery. Udziel uprawnien.',
    checkInError: 'Blad podczas meldowania',
    retake: 'Ponow',
    retry: 'Sprobuj ponownie',
    takePhoto: 'Sfotografuj budynek',
    reviewPhoto: 'Sprawdz zdjecie',
    reviewPhotoDesc: 'Czy budynek jest dobrze widoczny?',
    checkInConfirm: 'Zamelduj sie',
    checkingIn: 'Meldowanie...',
    uploadingPhoto: 'Przesylanie zdjecia',
    checkedInSuccess: 'Zameldowano!',
    gpsVerified: 'zweryfikowano',
    checkOutTitle: 'Wymeldowanie',
    checkedInLabel: 'Zameldowano',
    nowLabel: 'Teraz',
    durationLabel: 'Czas trwania',
    proofPhoto: 'Zdjecie dowodowe',
    proofPhotoDesc: 'Sfotografuj posprzatany obszar jako dowod wykonanej pracy.',
    photoCheckout: 'Zdjecie i wymeldowanie',
    takeWorkPhoto: 'Sfotografuj wykonana prace',
    reviewWorkDesc: 'Czy wykonana praca jest dobrze widoczna?',
    checkingOut: 'Wymeldowywanie...',
    checkOutSuccess: 'Gotowe!',
    durationPrefix: 'Czas: ',
    recordedInBilling: 'Zostanie zarejestrowane w rozliczeniu',
    checkOutError: 'Blad podczas wymeldowania',
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
    at: 'at',
    clock: '',
    notifAllowTitle: 'Allow notifications',
    notifAllowDesc: 'Get notified instantly when you have a new assignment.',
    notifActivating: 'Activating...',
    notifActivate: 'Yes, enable',
    notifLater: 'Later',
    notifActive: 'Notifications active — you will be informed about new assignments',
    checkedInAt: 'Checked in at',
    checkOut: 'Check out',
    checkInTitle: 'Check in',
    gpsChecking: 'Checking location...',
    gpsLocating: 'Getting GPS...',
    gpsGeocoding: 'Verifying address...',
    gpsConfirmed: 'Location confirmed',
    gpsDistanceFrom: 'from the location',
    gpsNotVerified: 'Address could not be verified',
    gpsTooFar: 'Too far away',
    gpsTooFarDesc: 'Allowed: up to',
    gpsMustBeOnSite: 'You must be on site to check in.',
    gpsAccessDenied: 'GPS access denied. Please allow in browser settings.',
    gpsUnavailable: 'GPS unavailable. Please try again.',
    cameraError: 'Could not open camera. Please grant permission.',
    checkInError: 'Error during check-in',
    retake: 'Retake',
    retry: 'Try again',
    takePhoto: 'Photograph building',
    reviewPhoto: 'Review photo',
    reviewPhotoDesc: 'Is the building clearly visible?',
    checkInConfirm: 'Check in',
    checkingIn: 'Checking in...',
    uploadingPhoto: 'Uploading photo',
    checkedInSuccess: 'Checked in!',
    gpsVerified: 'verified',
    checkOutTitle: 'Check out',
    checkedInLabel: 'Checked in',
    nowLabel: 'Now',
    durationLabel: 'Duration',
    proofPhoto: 'Proof photo',
    proofPhotoDesc: 'Photograph the cleaned area as proof of completed work.',
    photoCheckout: 'Photo & Check out',
    takeWorkPhoto: 'Photograph completed area',
    reviewWorkDesc: 'Is the completed work clearly visible?',
    checkingOut: 'Checking out...',
    checkOutSuccess: 'Done!',
    durationPrefix: 'Duration: ',
    recordedInBilling: 'Will be recorded in payroll',
    checkOutError: 'Error during check-out',
  },
};

export function t(lang: Lang, key: keyof TranslationKeys): string {
  return translations[lang]?.[key] ?? translations.de[key] ?? key;
}

export function isRTL(lang: Lang): boolean {
  return lang === 'ar';
}
