const SPANISH_COMMON_WORDS =
  'a al algo algun alguna alguno algunos ante antes aqui asi cada como con contra cual cuales cuando cuanto de del desde donde durante e el ella ellas ello ellos en entre era eran es esa esas ese eso esos esta estan estar estas este esto estos fue fueron ha han hasta hay la las le les lo los mas me mi mis muy ni no nos o otra otras otro otros para pero poco por porque puede pueden que quien se sea segun ser si sin sobre son su sus tambien tan te tiene tienen todo todos tu u un una unas uno unos y ya'

const FRAMING_WORDS = 'diferencia diferencias funciona hace pasa significa sirve usa'

const ENGLISH_COMMON_WORDS =
  'an and are as at be by do does for from how if in into is it its of on or that the this to was what when where which who why with'

const WORD_LIST_SEPARATOR = ' '

export const COMMON_WORDS: ReadonlySet<string> = new Set(
  [SPANISH_COMMON_WORDS, FRAMING_WORDS, ENGLISH_COMMON_WORDS]
    .join(WORD_LIST_SEPARATOR)
    .split(WORD_LIST_SEPARATOR),
)

export const COMBINING_MARKS = /\p{M}/gu

export const NOT_A_TERM_CHARACTER = /[^a-z0-9]+/

export const MIN_TERM_LENGTH = 2

export const LONG_PLURAL = { ending: 'es', minLength: 5 }

export const SHORT_PLURAL = { ending: 's', minLength: 4 }

export const SIMILAR_CARDS_LIMIT = 10

export const TAG_SEPARATOR = '::'
