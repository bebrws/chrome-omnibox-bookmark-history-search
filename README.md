I tried to find the easiest way to quickly search the Nim documentation and got pretty frustrated with the options.

So I made a somewhat future proof chrome extension.

Instead of just injecting some function calls using the javascript functions created by the nim javascript backend for this current nim build I actually parse out the function names using strings that should remain the same regardless of minor changes to nim or the current build then create a javascript string to inject that will call search using the search url hash value.

So now anytime you goto a nim-lang.org page with a #search hash key and value set the content script will look for a search function on window and attempt to search.

The background.js script is where the omnibox code comes in.

When the nim keyword is used the remaining text is used to build a url setting the search hash key I mentioned which my content script will use to search the nim docs.

Hope this is helpful.

