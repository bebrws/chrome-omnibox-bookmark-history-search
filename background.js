var bookmarkTitleToURLMap = [];
var longestBookmarkTitleToURL = 0;
var lastTopScoreURL = "https://google.com/";

function fuzzyMatch(str, pattern, longestItemLength) {

    let strIndex = 0
    let patIndex = 0
    let lastCharMatchedScore = 0
    let numInRow = 0
    let score = 0
  
    while (strIndex < str.length && patIndex < pattern.length) {
      let patternChar = pattern[patIndex].toLowerCase()
      let strChar     = str[strIndex].toLowerCase()
  
      if (strIndex == 0 && patternChar == strChar) {
        score += longestItemLength
        lastCharMatchedScore += 2
        patIndex += 1
        strIndex += 1
        numInRow += 1
      } else if (strChar == patternChar) {
        score += (longestItemLength/strIndex) * (numInRow ? (numInRow * 3) : 1)
        if (lastCharMatchedScore != 0) {
          lastCharMatchedScore += 2
          score += lastCharMatchedScore
        }
        numInRow += 1
        strIndex += 1
        patIndex += 1
      } else {
        numInRow = 0
        if (!['_', ' ', '.'].includes(strIndex)) {
          lastCharMatchedScore = 0
        }
        strIndex += 1
      }
    }
  
    return {
      score:   Math.max(0, score),
      matched: (score > 0),
      item: str
    }
  
  }

(function() {
    const main = async () => {

        const getBookmarkTitleToURLMap = new Promise((resolve, reject) => {
            function recursiveSearchBookmarksTree(bookmarksNodeArray, addBookmarkToMapCallback){
                for (let bookmark of bookmarksNodeArray) {
                    if('children' in bookmark){
                        recursiveSearchBookmarksTree(bookmark.children, addBookmarkToMapCallback);
                    } else if('url' in bookmark && 'title' in bookmark && bookmark.title.length > 0 && bookmark.url.length > 0) {
                        addBookmarkToMapCallback(bookmark);
                    }
                }
            };

            function startBookmarkTreeSearch(bookmarksNodeArray, finishedCallback){
                let bookmarkTitleToURLMap = [];
                recursiveSearchBookmarksTree(bookmarksNodeArray, (bookmark) => {
                    let key = `${bookmark.title.toLowerCase()}  ${bookmark.url}`.replace("<", "").replace(">", "");
                    bookmarkTitleToURLMap[key] = bookmark.url;
                });
                finishedCallback(bookmarkTitleToURLMap);
            }
            
            chrome.bookmarks.getTree(function(results){
                startBookmarkTreeSearch(results, (bookmarkTitleToURLMap) => {
                    resolve(bookmarkTitleToURLMap);
                });
            });
        });

        bookmarkTitleToURLMap = await getBookmarkTitleToURLMap;
        longestBookmarkTitleToURL = Object.keys(bookmarkTitleToURLMap).reduce((acc, cur) => { return cur.length > acc ? cur.length : acc; }, 0);
    };

    main().then((res) => {
        console.log("Bookmark And History Fuzzy String Search Extension finished loading.");
    });
})();

// chrome.runtime.onMessage.addListener(function (message) {
//     // console.log(message)
// });

chrome.omnibox.onInputChanged.addListener((input, suggest) => {
    const fuzzyScores = Object.keys(bookmarkTitleToURLMap).map(but => {
        // but is bookmark url title
        return fuzzyMatch(but, input, longestBookmarkTitleToURL);
    });
    fuzzyScores.sort((a, b) => {
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return 0;
    })
    const topFuzzyScores = fuzzyScores.slice(0, Math.min(fuzzyScores.length, 4));

    const topScoringItmes = topFuzzyScores.map(si => {
        return {
            content: bookmarkTitleToURLMap[si.item],
            description: si.item
        }
    });

    let topItemArray = topScoringItmes.slice(0,1);
    const topItem = topItemArray[0];
    lastTopScoreURL = topItem.content;
    let remainingItems = topScoringItmes.slice(1,topScoringItmes.length);

    chrome.omnibox.setDefaultSuggestion({
        description: `<url>(${topItem.content})</url> ${topItem.description}`
    });

    chrome.history.search({text: 'frida', maxResults: 4}, (historyItemsArray) => {
        for (let hi of historyItemsArray) {
            remainingItems.push({
                content: hi.url,
                description: hi.title
            });
        }
        try {
        suggest(remainingItems);
        } catch(e) {
            // Do something with exceptions parsing the returned results
        }
    });
});

// chrome.omnibox.onInputStarted.addListener(function (event) {
// });

chrome.omnibox.onInputEntered.addListener(function (text, disposition) {
    let urlToGoto = text;
    if (!text.includes("http")) {
        urlToGoto = lastTopScoreURL;
    }
    chrome.tabs.update({ url: urlToGoto });
});