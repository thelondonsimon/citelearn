"""
Parses text input into paragraphs and sentences
"""

import re
import nltk
import nltk.data

# configure sentence detector
nltk.download('punkt')
extra_abbreviations = ['pp', 'no', 'vol', 'ed', 'al', 'e.g', 'etc', 'i.e',
        'pg', 'dr', 'mr', 'mrs', 'ms', 'vs', 'prof', 'inc', 'incl', 'u.s', 'st',
        'trans', 'ex']
sent_detector = nltk.data.load('tokenizers/punkt/english.pickle')
sent_detector._params.abbrev_types.update(extra_abbreviations)

def parseParagraphs(text: str) -> list:
    if type(text) != str:
        raise TypeError('inputParser.parseParagraphs(text) expects text as str')

    text = re.sub(r"\n+","\n",text)
    paragraphInputs = text.split("\n")
    paragraphTypes = []
    for p in paragraphInputs:
        sentences = sent_detector.tokenize(p)
        if len(sentences) < 2:
            if p.strip() == '':
                paragraphTypes.append('empty')
            elif p.strip()[-1] == '.':
                paragraphTypes.append('paragraph')
            else:
                paragraphTypes.append('heading')
        else:
            paragraphTypes.append('paragraph')

    # remove empty paragraphs
    emptyIndices = [i for i, x in enumerate(paragraphTypes) if x == "empty"]
    for i in sorted(emptyIndices, reverse = True):
        paragraphTypes.pop(i)
        paragraphInputs.pop(i)

    paragraphs = []
    for i,p in enumerate(paragraphTypes):
        # check if we have a heading and the next item is a paragraph
        if p == 'heading' and len(paragraphInputs) > (i+1) and paragraphTypes[i+1] == 'paragraph':
            continue
        else:
            if p == 'paragraph' and paragraphTypes[i-1] == 'heading':
                heading = paragraphInputs[i-1]
            else:
                heading = None
            sentences = list(map(lambda x: { 'rawInput': x },sent_detector.tokenize(paragraphInputs[i])))
            paragraphs.append({ 'rawInput': paragraphInputs[i], 'sentences': sentences, 'sequence': len(paragraphs) + 1, 'heading': heading})

    return paragraphs