/**
 * Uplore i18n — four dictionaries, zero deps.
 * UI chrome only; user-generated content is never translated.
 *
 * Dict         — full server-side dictionary (may include functions)
 * ClientDict   — serializable subset safe to pass across the RSC boundary
 */

export type Locale = 'en' | 'ru' | 'uk' | 'pl'

export interface LocaleMeta {
  code: Locale
  label: string
  /** 2-letter badge shown in the compact switcher. Defaults to code uppercased;
   *  Ukrainian is shown as "UA" (country code) since "UK" reads as Britain. */
  badge: string
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'English', badge: 'EN' },
  { code: 'ru', label: 'Русский', badge: 'RU' },
  { code: 'uk', label: 'Українська', badge: 'UA' },
  { code: 'pl', label: 'Polski', badge: 'PL' },
]

/** Relative-time shape: functions so plural rules stay per-locale. */
export interface TimeDict {
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  weeksAgo: (n: number) => string
  monthsAgo: (n: number) => string
  yearsAgo: (n: number) => string
}

/** Full server-side dictionary — NOT serializable across RSC boundary. */
export interface Dict {
  // Header
  signIn: string
  signOut: string
  newIdea: string

  // Feed
  feedHeading: string
  noIdeasYet: string
  beFirstToPost: string
  footer: string

  // Idea detail
  backToFeed: string
  commentsHeading: (n: number) => string
  noCommentsYet: string

  // NewIdeaModal
  newIdeaTitle: string
  ideaPlaceholder: string
  attachImages: string
  imagesSelected: (n: number) => string
  cancel: string
  post: string
  posting: string
  ideaTooShort: string
  failedToPost: string
  networkError: string

  // AddCommentForm
  commentPlaceholder: string
  signInToComment: string
  toLeaveComment: string
  postComment: string
  postingComment: string
  failedToPostComment: string

  // ReactionChips
  react: string

  // Gate page / GateForm
  teamAccess: string
  boardIsPrivate: string
  teamPassword: string
  enter: string
  verifyingLink: string
  incorrectCode: string
  networkErrorGate: string

  // Login page
  signInHeading: string
  signInSubheading: string
  orDevLogin: string

  // Relative time (server-side only)
  time: TimeDict
}

/**
 * Serializable subset for client components.
 * All values are plain strings — safe to pass as RSC props.
 * Parametrized strings (e.g. "N images selected") are omitted here;
 * the server or client resolves them independently.
 */
export interface ClientDict {
  // Header / shared
  signIn: string
  signOut: string
  newIdea: string
  footer: string

  // NewIdeaModal
  newIdeaTitle: string
  ideaPlaceholder: string
  attachImages: string
  /** Template: use {n} placeholder; client replaces via formatN() */
  imagesSelectedTpl: string
  cancel: string
  post: string
  posting: string
  ideaTooShort: string
  failedToPost: string
  networkError: string

  // AddCommentForm
  commentPlaceholder: string
  signInToComment: string
  toLeaveComment: string
  postComment: string
  postingComment: string
  failedToPostComment: string

  // ReactionChips
  react: string

  // ArchiveButton (owner only)
  archiveIdea: string
  unarchiveIdea: string

  // GateForm
  teamPassword: string
  enter: string
  verifyingLink: string
  incorrectCode: string
  networkErrorGate: string

  // Login
  signInHeading: string
  signInSubheading: string
  orDevLogin: string
}

/** Replace {n} in a template string. */
export function formatN(tpl: string, n: number): string {
  return tpl.replace('{n}', String(n))
}

// ─── English ─────────────────────────────────────────────────────────────────

const en: Dict = {
  signIn: 'Sign in',
  signOut: 'Sign out',
  newIdea: '+ New idea',

  feedHeading: 'Ideas · by votes',
  noIdeasYet: 'No ideas yet.',
  beFirstToPost: 'Be the first to post one!',
  footer: 'Norm Ideas · open source',

  backToFeed: '← Back to feed',
  commentsHeading: (n) => `Comments · ${n}`,
  noCommentsYet: 'No comments yet. Be the first!',

  newIdeaTitle: 'New idea',
  ideaPlaceholder: 'Describe your idea in 1–2 sentences…',
  attachImages: 'Attach images',
  imagesSelected: (n) => `${n} image${n === 1 ? '' : 's'} selected`,
  cancel: 'Cancel',
  post: 'Post idea',
  posting: 'Posting…',
  ideaTooShort: 'Idea must be at least 3 characters.',
  failedToPost: 'Failed to post idea.',
  networkError: 'Network error. Please try again.',

  commentPlaceholder: 'Add a comment…',
  signInToComment: 'Sign in',
  toLeaveComment: 'to leave a comment.',
  postComment: 'Post comment',
  postingComment: 'Posting…',
  failedToPostComment: 'Failed to post comment.',

  react: 'React',

  teamAccess: 'Team access',
  boardIsPrivate: 'This board is private. Enter the team password to continue.',
  teamPassword: 'Team password',
  enter: 'Enter',
  verifyingLink: 'Verifying link…',
  incorrectCode: 'Incorrect code',
  networkErrorGate: 'Network error — please try again',

  signInHeading: 'Sign in',
  signInSubheading: 'Sign in to post ideas, vote, and comment.',
  orDevLogin: 'or dev login',

  time: {
    justNow: 'just now',
    minutesAgo: (n) => `${n} minute${n === 1 ? '' : 's'} ago`,
    hoursAgo: (n) => `${n} hour${n === 1 ? '' : 's'} ago`,
    daysAgo: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
    weeksAgo: (n) => `${n} week${n === 1 ? '' : 's'} ago`,
    monthsAgo: (n) => `${n} month${n === 1 ? '' : 's'} ago`,
    yearsAgo: (n) => `${n} year${n === 1 ? '' : 's'} ago`,
  },
}

const enClient: ClientDict = {
  signIn: 'Sign in',
  signOut: 'Sign out',
  newIdea: '+ New idea',
  footer: 'Norm Ideas · open source',
  newIdeaTitle: 'New idea',
  ideaPlaceholder: 'Describe your idea in 1–2 sentences…',
  attachImages: 'Attach images',
  imagesSelectedTpl: '{n} image(s) selected',
  cancel: 'Cancel',
  post: 'Post idea',
  posting: 'Posting…',
  ideaTooShort: 'Idea must be at least 3 characters.',
  failedToPost: 'Failed to post idea.',
  networkError: 'Network error. Please try again.',
  commentPlaceholder: 'Add a comment…',
  signInToComment: 'Sign in',
  toLeaveComment: 'to leave a comment.',
  postComment: 'Post comment',
  postingComment: 'Posting…',
  failedToPostComment: 'Failed to post comment.',
  react: 'React',
  archiveIdea: 'Archive',
  unarchiveIdea: 'Restore',
  teamPassword: 'Team password',
  enter: 'Enter',
  verifyingLink: 'Verifying link…',
  incorrectCode: 'Incorrect code',
  networkErrorGate: 'Network error — please try again',
  signInHeading: 'Sign in',
  signInSubheading: 'Sign in to post ideas, vote, and comment.',
  orDevLogin: 'or dev login',
}

// ─── Russian ──────────────────────────────────────────────────────────────────

function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`
  return `${n} ${many}`
}

const ru: Dict = {
  signIn: 'Войти',
  signOut: 'Выйти',
  newIdea: '+ Новая идея',

  feedHeading: 'Идеи · по голосам',
  noIdeasYet: 'Идей пока нет.',
  beFirstToPost: 'Будьте первым!',
  footer: 'Norm Ideas · открытый код',

  backToFeed: '← К списку идей',
  commentsHeading: (n) => `Комментарии · ${n}`,
  noCommentsYet: 'Комментариев пока нет. Будьте первым!',

  newIdeaTitle: 'Новая идея',
  ideaPlaceholder: 'Опишите идею в 1–2 предложениях…',
  attachImages: 'Прикрепить изображения',
  imagesSelected: (n) => `${ruPlural(n, 'изображение', 'изображения', 'изображений')} выбрано`,
  cancel: 'Отмена',
  post: 'Опубликовать',
  posting: 'Публикуем…',
  ideaTooShort: 'Идея должна содержать не менее 3 символов.',
  failedToPost: 'Не удалось опубликовать идею.',
  networkError: 'Ошибка сети. Попробуйте ещё раз.',

  commentPlaceholder: 'Написать комментарий…',
  signInToComment: 'Войдите',
  toLeaveComment: 'чтобы оставить комментарий.',
  postComment: 'Отправить',
  postingComment: 'Отправляем…',
  failedToPostComment: 'Не удалось отправить комментарий.',

  react: 'Реакция',

  teamAccess: 'Доступ к команде',
  boardIsPrivate: 'Доска закрытая. Введите командный пароль для входа.',
  teamPassword: 'Командный пароль',
  enter: 'Войти',
  verifyingLink: 'Проверяем ссылку…',
  incorrectCode: 'Неверный код',
  networkErrorGate: 'Ошибка сети — попробуйте снова',

  signInHeading: 'Вход',
  signInSubheading: 'Войдите, чтобы публиковать идеи, голосовать и комментировать.',
  orDevLogin: 'или войти через dev',

  time: {
    justNow: 'только что',
    minutesAgo: (n) => `${ruPlural(n, 'минуту', 'минуты', 'минут')} назад`,
    hoursAgo: (n) => `${ruPlural(n, 'час', 'часа', 'часов')} назад`,
    daysAgo: (n) => `${ruPlural(n, 'день', 'дня', 'дней')} назад`,
    weeksAgo: (n) => `${ruPlural(n, 'неделю', 'недели', 'недель')} назад`,
    monthsAgo: (n) => `${ruPlural(n, 'месяц', 'месяца', 'месяцев')} назад`,
    yearsAgo: (n) => `${ruPlural(n, 'год', 'года', 'лет')} назад`,
  },
}

const ruClient: ClientDict = {
  signIn: 'Войти',
  signOut: 'Выйти',
  newIdea: '+ Новая идея',
  footer: 'Norm Ideas · открытый код',
  newIdeaTitle: 'Новая идея',
  ideaPlaceholder: 'Опишите идею в 1–2 предложениях…',
  attachImages: 'Прикрепить изображения',
  imagesSelectedTpl: '{n} изобр. выбрано',
  cancel: 'Отмена',
  post: 'Опубликовать',
  posting: 'Публикуем…',
  ideaTooShort: 'Идея должна содержать не менее 3 символов.',
  failedToPost: 'Не удалось опубликовать идею.',
  networkError: 'Ошибка сети. Попробуйте ещё раз.',
  commentPlaceholder: 'Написать комментарий…',
  signInToComment: 'Войдите',
  toLeaveComment: 'чтобы оставить комментарий.',
  postComment: 'Отправить',
  postingComment: 'Отправляем…',
  failedToPostComment: 'Не удалось отправить комментарий.',
  react: 'Реакция',
  archiveIdea: 'Архивировать',
  unarchiveIdea: 'Вернуть',
  teamPassword: 'Командный пароль',
  enter: 'Войти',
  verifyingLink: 'Проверяем ссылку…',
  incorrectCode: 'Неверный код',
  networkErrorGate: 'Ошибка сети — попробуйте снова',
  signInHeading: 'Вход',
  signInSubheading: 'Войдите, чтобы публиковать идеи, голосовать и комментировать.',
  orDevLogin: 'или войти через dev',
}

// ─── Ukrainian ────────────────────────────────────────────────────────────────

function ukPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`
  return `${n} ${many}`
}

const uk: Dict = {
  signIn: 'Увійти',
  signOut: 'Вийти',
  newIdea: '+ Нова ідея',

  feedHeading: 'Ідеї · за голосами',
  noIdeasYet: 'Ідей ще немає.',
  beFirstToPost: 'Будьте першим!',
  footer: 'Norm Ideas · відкритий код',

  backToFeed: '← До списку ідей',
  commentsHeading: (n) => `Коментарі · ${n}`,
  noCommentsYet: 'Коментарів ще немає. Будьте першим!',

  newIdeaTitle: 'Нова ідея',
  ideaPlaceholder: 'Опишіть ідею в 1–2 реченнях…',
  attachImages: 'Прикріпити зображення',
  imagesSelected: (n) => `${ukPlural(n, 'зображення', 'зображення', 'зображень')} вибрано`,
  cancel: 'Скасувати',
  post: 'Опублікувати',
  posting: 'Публікуємо…',
  ideaTooShort: 'Ідея має містити не менше 3 символів.',
  failedToPost: 'Не вдалося опублікувати ідею.',
  networkError: 'Помилка мережі. Спробуйте ще раз.',

  commentPlaceholder: 'Написати коментар…',
  signInToComment: 'Увійдіть',
  toLeaveComment: 'щоб залишити коментар.',
  postComment: 'Надіслати',
  postingComment: 'Надсилаємо…',
  failedToPostComment: 'Не вдалося надіслати коментар.',

  react: 'Реакція',

  teamAccess: 'Доступ до команди',
  boardIsPrivate: 'Дошка закрита. Введіть командний пароль для входу.',
  teamPassword: 'Командний пароль',
  enter: 'Увійти',
  verifyingLink: 'Перевіряємо посилання…',
  incorrectCode: 'Невірний код',
  networkErrorGate: 'Помилка мережі — спробуйте знову',

  signInHeading: 'Вхід',
  signInSubheading: 'Увійдіть, щоб публікувати ідеї, голосувати та коментувати.',
  orDevLogin: 'або увійти через dev',

  time: {
    justNow: 'щойно',
    minutesAgo: (n) => `${ukPlural(n, 'хвилину', 'хвилини', 'хвилин')} тому`,
    hoursAgo: (n) => `${ukPlural(n, 'годину', 'години', 'годин')} тому`,
    daysAgo: (n) => `${ukPlural(n, 'день', 'дні', 'днів')} тому`,
    weeksAgo: (n) => `${ukPlural(n, 'тиждень', 'тижні', 'тижнів')} тому`,
    monthsAgo: (n) => `${ukPlural(n, 'місяць', 'місяці', 'місяців')} тому`,
    yearsAgo: (n) => `${ukPlural(n, 'рік', 'роки', 'років')} тому`,
  },
}

const ukClient: ClientDict = {
  signIn: 'Увійти',
  signOut: 'Вийти',
  newIdea: '+ Нова ідея',
  footer: 'Norm Ideas · відкритий код',
  newIdeaTitle: 'Нова ідея',
  ideaPlaceholder: 'Опишіть ідею в 1–2 реченнях…',
  attachImages: 'Прикріпити зображення',
  imagesSelectedTpl: '{n} зображ. вибрано',
  cancel: 'Скасувати',
  post: 'Опублікувати',
  posting: 'Публікуємо…',
  ideaTooShort: 'Ідея має містити не менше 3 символів.',
  failedToPost: 'Не вдалося опублікувати ідею.',
  networkError: 'Помилка мережі. Спробуйте ще раз.',
  commentPlaceholder: 'Написати коментар…',
  signInToComment: 'Увійдіть',
  toLeaveComment: 'щоб залишити коментар.',
  postComment: 'Надіслати',
  postingComment: 'Надсилаємо…',
  failedToPostComment: 'Не вдалося надіслати коментар.',
  react: 'Реакція',
  archiveIdea: 'Архівувати',
  unarchiveIdea: 'Повернути',
  teamPassword: 'Командний пароль',
  enter: 'Увійти',
  verifyingLink: 'Перевіряємо посилання…',
  incorrectCode: 'Невірний код',
  networkErrorGate: 'Помилка мережі — спробуйте знову',
  signInHeading: 'Вхід',
  signInSubheading: 'Увійдіть, щоб публікувати ідеї, голосувати та коментувати.',
  orDevLogin: 'або увійти через dev',
}

// ─── Polish ───────────────────────────────────────────────────────────────────

function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `${n} ${one}`
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`
  return `${n} ${many}`
}

const pl: Dict = {
  signIn: 'Zaloguj się',
  signOut: 'Wyloguj się',
  newIdea: '+ Nowy pomysł',

  feedHeading: 'Pomysły · według głosów',
  noIdeasYet: 'Brak pomysłów.',
  beFirstToPost: 'Bądź pierwszym, który go doda!',
  footer: 'Norm Ideas · open source',

  backToFeed: '← Wróć do listy',
  commentsHeading: (n) => `Komentarze · ${n}`,
  noCommentsYet: 'Brak komentarzy. Bądź pierwszy!',

  newIdeaTitle: 'Nowy pomysł',
  ideaPlaceholder: 'Opisz swój pomysł w 1–2 zdaniach…',
  attachImages: 'Dodaj zdjęcia',
  imagesSelected: (n) => `${plPlural(n, 'zdjęcie', 'zdjęcia', 'zdjęć')} wybrano`,
  cancel: 'Anuluj',
  post: 'Opublikuj',
  posting: 'Publikowanie…',
  ideaTooShort: 'Pomysł musi mieć co najmniej 3 znaki.',
  failedToPost: 'Nie udało się opublikować pomysłu.',
  networkError: 'Błąd sieci. Spróbuj ponownie.',

  commentPlaceholder: 'Dodaj komentarz…',
  signInToComment: 'Zaloguj się',
  toLeaveComment: 'aby dodać komentarz.',
  postComment: 'Wyślij',
  postingComment: 'Wysyłanie…',
  failedToPostComment: 'Nie udało się wysłać komentarza.',

  react: 'Reakcja',

  teamAccess: 'Dostęp do zespołu',
  boardIsPrivate: 'Ta tablica jest prywatna. Podaj hasło zespołu, aby kontynuować.',
  teamPassword: 'Hasło zespołu',
  enter: 'Wejdź',
  verifyingLink: 'Weryfikacja linku…',
  incorrectCode: 'Nieprawidłowy kod',
  networkErrorGate: 'Błąd sieci — spróbuj ponownie',

  signInHeading: 'Logowanie',
  signInSubheading: 'Zaloguj się, aby dodawać pomysły, głosować i komentować.',
  orDevLogin: 'lub dev login',

  time: {
    justNow: 'przed chwilą',
    minutesAgo: (n) => `${plPlural(n, 'minutę', 'minuty', 'minut')} temu`,
    hoursAgo: (n) => `${plPlural(n, 'godzinę', 'godziny', 'godzin')} temu`,
    daysAgo: (n) => `${plPlural(n, 'dzień', 'dni', 'dni')} temu`,
    weeksAgo: (n) => `${plPlural(n, 'tydzień', 'tygodnie', 'tygodni')} temu`,
    monthsAgo: (n) => `${plPlural(n, 'miesiąc', 'miesiące', 'miesięcy')} temu`,
    yearsAgo: (n) => `${plPlural(n, 'rok', 'lata', 'lat')} temu`,
  },
}

const plClient: ClientDict = {
  signIn: 'Zaloguj się',
  signOut: 'Wyloguj się',
  newIdea: '+ Nowy pomysł',
  footer: 'Norm Ideas · open source',
  newIdeaTitle: 'Nowy pomysł',
  ideaPlaceholder: 'Opisz swój pomysł w 1–2 zdaniach…',
  attachImages: 'Dodaj zdjęcia',
  imagesSelectedTpl: '{n} zdj. wybrano',
  cancel: 'Anuluj',
  post: 'Opublikuj',
  posting: 'Publikowanie…',
  ideaTooShort: 'Pomysł musi mieć co najmniej 3 znaki.',
  failedToPost: 'Nie udało się opublikować pomysłu.',
  networkError: 'Błąd sieci. Spróbuj ponownie.',
  commentPlaceholder: 'Dodaj komentarz…',
  signInToComment: 'Zaloguj się',
  toLeaveComment: 'aby dodać komentarz.',
  postComment: 'Wyślij',
  postingComment: 'Wysyłanie…',
  failedToPostComment: 'Nie udało się wysłać komentarza.',
  react: 'Reakcja',
  archiveIdea: 'Archiwizuj',
  unarchiveIdea: 'Przywróć',
  teamPassword: 'Hasło zespołu',
  enter: 'Wejdź',
  verifyingLink: 'Weryfikacja linku…',
  incorrectCode: 'Nieprawidłowy kod',
  networkErrorGate: 'Błąd sieci — spróbuj ponownie',
  signInHeading: 'Logowanie',
  signInSubheading: 'Zaloguj się, aby dodawać pomysły, głosować i komentować.',
  orDevLogin: 'lub dev login',
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const dictionaries: Record<Locale, Dict> = { en, ru, uk, pl }
export const clientDictionaries: Record<Locale, ClientDict> = {
  en: enClient,
  ru: ruClient,
  uk: ukClient,
  pl: plClient,
}
