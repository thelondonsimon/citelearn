## configuration implementation replicated from citation detective https://github.com/AikoChou/citationdetective

import os
import types
from functools import reduce

# A base configuration that all languages "inherit" from.
_BASE_LANG_CONFIG = dict(
    articles_sampling_fraction = 2e-2,
    statement_max_size = 5000,
    context_max_size = 5000,
    min_sentence_length = 6
)

# Language-specific config, inheriting from the base config above.
_LANG_CODE_TO_CONFIG = dict(
    en = dict(
        # A friendly name for the language
        lang_name = 'English',
        # The direction of the language, either ltr or rtl
        lang_dir = 'ltr',
        # Dictionary of word to vector
        vocb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dictionaries/word_dict_en.pck')),
        # Dictionary of section title to vector
        section_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dictionaries/section_dict_en.pck')),
        # Tensorflow models to detect Citation Need for English
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/fa_en_model_rnn_attention_section.h5')),
        # Argument for padding word vectors to the same length
        # so as to use as the input for the RNN model
        word_vector_length = 187,
    ),

    it = dict(
        lang_name = 'Italiano',
        lang_dir = 'ltr',
        vocb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dictionaries/word_dict_it.pck')),
        section_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dictionaries/section_dict_it.pck')),
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'model/fa_it_model_rnn_attention_section.h5')),
        word_vector_length = 319,
    ),

    fr = dict(
        lang_name = 'Français',
        lang_dir = 'ltr',
        vocb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dictionaries/word_dict_fr.pck')),
        section_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dictionaries/section_dict_fr.pck')),
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'model/fa_fr_model_rnn_attention_section.h5')),
        word_vector_length = 296,
    ),
)

Config = types.SimpleNamespace

def _inherit(base, child):
    ret = dict(base)  # shallow copy
    for k, v in child.items():
        if k in ret:
            if isinstance(v, list):
                v = ret[k] + v
            elif isinstance(v, dict):
                v = dict(ret[k], **v)
        ret[k] = v
    return ret

LANG_CODES_TO_LANG_NAMES = {
    lang_code: _LANG_CODE_TO_CONFIG[lang_code]['lang_name']
    for lang_code in _LANG_CODE_TO_CONFIG
}

def get_localized_config(lang_code='en'):
    if lang_code is None:
        lang_code = os.getenv('CD_LANG')
    lang_config = _LANG_CODE_TO_CONFIG[lang_code]
    cfg = Config(lang_code = lang_code, **reduce(
        _inherit, [_BASE_LANG_CONFIG, lang_config]))
    cfg.lang_codes_to_lang_names = LANG_CODES_TO_LANG_NAMES
    return cfg
