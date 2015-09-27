var axios = require('axios');
var Promise = require('bluebird');
var _ = require('underscore');

var cardGuides = require('./cards.json');

var API_KEY = '07ccdc0787034cabb78110651e94ccfc';

var membershipDataCache = {};

var CONSOLE_TO_TYPE = {
    xbox: 1,
    playstation: 2,
};

var destiny = function(apiPath, customData) {
    var apiBase = 'http://www.bungie.net/Platform/Destiny';
    var config = {
        url: apiBase + apiPath,
        timeout: 10 * 1000,
        headers: {
            'X-API-KEY':API_KEY
        },
        _customData: customData,
    };

    return axios(config)
};

var fromRoman = function(roman, accept){
    var s= roman.toUpperCase().replace(/ +/g, ''),
    L= s.length, sum= 0, i= 0, next, val,
    R={M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1},

    fromBigRoman = function(rn){
        var n= 0, x, n1, S, rx=/(\(*)([MDCLXVI]+)/g;

        while((S= rx.exec(rn))!= null){
            x= S[1].length;
            n1= Number.fromRoman(S[2])
            if(isNaN(n1)) return NaN;
            if(x) n1*= Math.pow(1000, x)
            n+= n1;
        }

        return n;
    }

    if (/^[MDCLXVI)(]+$/.test(s)){

        if(s.indexOf('(')== 0) {
            return fromBigRoman(s)
        };

        while(i<L){
            val= R[s.charAt(i++)];
            next= R[s.charAt(i)] || 0;
            if(next-val>0) val*= -1;
            sum+= val;
        }

        return sum
    }

    return NaN;
}

var getSorrowCards = function(definitions) {
    var enemies = definitions.themeCollection[3];
    console.assert(enemies.themeId === 'Enemies', 'themeCollection[3] should be Enemies, it was ', + enemies.themeId);

    var bookOfSorrow = enemies.pageCollection[14];
    console.assert(bookOfSorrow.pageId === 'BooksofSorrow', 'pageCollection[14] should be BooksofSorrow, it was ' + bookOfSorrow.pageId);

    var sorrowCards = bookOfSorrow.cardCollection;
    var cardsById = {};

    sorrowCards.forEach(function(card) {
        cardsById[card.cardId] = card;
    });

    return cardsById;
}

var getUserPromise = function(username, platform) {
    var membershipType = CONSOLE_TO_TYPE[platform];
    var cachedMembershipData = membershipDataCache[username + '@' + membershipType];

    if (cachedMembershipData) {
        console.log('User membership data cached, using it.');

        var url = '/Vanguard/Grimoire/' + cachedMembershipData.membershipType + '/' + cachedMembershipData.membershipId + '/';
        return destiny(url, cachedMembershipData);
    }

    console.log('User membership data not cached. Searching');

    return destiny('/SearchDestinyPlayer/' + membershipType + '/' + username + '/')
        .then(function(resp) {
            var membershipId = resp.data.Response[0].membershipId;
            var displayName = resp.data.Response[0].displayName;
            var customData = {
                membershipId: membershipId,
                displayName: displayName,
                membershipType: membershipType,
            };

            membershipDataCache[username + '@' + membershipType] = customData;
            return destiny('/Vanguard/Grimoire/' + membershipType + '/' + membershipId + '/', customData);
        });
}

var defsRequest = destiny('/Vanguard/Grimoire/Definition/');

module.exports = function(username, platform) {
    var userGrimoireRequest = getUserPromise(username, platform);

    return Promise.all([defsRequest, userGrimoireRequest])
        .then(function(results) {
            var defsResp = results[0];
            var userGrimoireResp = results[1];

            var definitions = defsResp.data.Response;
            var grimoire = userGrimoireResp.data.Response.data;

            var cards = getSorrowCards(definitions);

            grimoire.cardCollection.forEach(function(card) {
                var fragmentCard = cards[card.cardId.toString()];

                if (fragmentCard) {
                    fragmentCard.hasCard = card.score == card.points;
                }
            });

            var card, roman, cardNo;
            var numOfFragments = Object.keys(cards).length;
            var fragmentsFound = numOfFragments;

            var fragments = _.map(cards, function(card) {
                roman = card.cardName.split(':')[0];
                card.cardNo = fromRoman(roman);

                card.hasCard = card.hasCard || false;
                card.guide = cardGuides[card.cardNo];
                card.isUnknown  = (card.guide.location + card.guide.video).toLowerCase().match(/un(discover|confirm)ed/);

                return card
            });

            return {
                fragments: fragments,
                displayName: userGrimoireResp.config._customData.displayName,
            }
        })

}
