all: chrome-omnibox-bookmark-history-search.zip

chrome-omnibox-bookmark-history-search.zip:
	rm -f chrome-omnibox-bookmark-history-search.zip
	zip chrome-omnibox-bookmark-history-search.zip $$(ls ./)
	

clean:
	rm *.zip