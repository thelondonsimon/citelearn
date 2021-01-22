"""
A series of regular expressions which attempt to detect (APA style) in-text citations within sentences
"""

import re

def detectCitation(text: str) -> str:
    if type(text) != str:
        raise TypeError('citationdetector.detectCitation(text) expects text as str')

    detected = False

    # author/year, e.g.:
    # - ... Bourdieu (1984)
    # - ... Bourdieu (1984a p 56)
    # - ... Bourdieu (1984a, pp. 56-67)
    # - ... Bourdieu (1984a, pp. 56-67; 1992)
    # - ... habitus (Bourdieu & Wacquant, 1984)
    # - ... habitus (Bourdieu and Passeron, 1990)
    # - ... habitus (P. Bourdieu 1984a)
    # - ... parole (de Saussure, 1959 para 2)
    # - ... habitus (Bourdieu, 1984 pp 56-59; Wacquant, 1990)
    # - ... habitus" (Bourdieu quoted in Wacquant, 1990)
    authorYearRe = re.compile(r"\b['\"’]? \((([\w \.&\[\],]+,? )?(?<!in )\d{4}[a-z]?,? ?(p|pp|para|page|pages)?[\. ]{0,2}\d*-?\d*;? ?)+\)")


    # full date, e.g.:
    # - ... Anderson (2018, May 20)
    # - ... music (Anderson, 2018 May)
    fullDateRe = re.compile(r"\b['\"’]? \(([\w \.&\[\],]+,? )?\d{4},? \w+ ?(\d{1,2}[thsrd]{0,2})?\)")


    # reverse full date, e.g.:
    # - ... Anderson (20th May 2018)
    # - ... music (Anderson May, 2018)
    fullDateRevRe = re.compile(r"\b['\"’]? \((\d{1,2}[thsrd]{0,2} )?\w+ ?,? \d{4}\)")


    # no date, e.g.:
    # - ... Anderson (n.d.)
    # - ... Anderson (nd)
    noDateRe = re.compile(r"\b['\"’]? \(n\.?d\.?\)")


    ################
    # known issues #
    ################
    # false negatives not matching:
    # - ... art" (Becker, 1982, p. 35, emphasis added) ==> can't discern not ending in known permutation
    # - ... habitus (Becker in 1984) ==> "x in YYYY" is explicitly ignored to avoid false positives
    # - ... (p. 261) ===> what are effectively ibid quotes are not detected
    #
    # false positives:
    # - ... (in 1992)


    res = [authorYearRe,fullDateRe,fullDateRevRe,noDateRe]
    for r in res:
        found = r.search(text)
        if found:
            detected = True
            break


    return detected