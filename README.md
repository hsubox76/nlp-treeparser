# nlp-treeparser

This is a simple English language tree parser that creates a parse tree of a
given sentence and displays the tree graphically using D3.

It uses the treebank tokenizer from [Natural Node](https://github.com/NaturalNode/natural)
and the POS tagger from [pos-js](https://github.com/dariusk/pos-js) to create tokens tagged
with part-of-speech, and goes from there to try to determined a tree hierarchy.
