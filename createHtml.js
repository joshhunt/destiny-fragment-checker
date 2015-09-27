var STYLES = [
    '<style>',
        '* { font-family: monospace }',
        'table { border-collapse: collapse; }',
        'table { width: 100%; }',
        'td { padding: 10px; }',
        'td { border: 1px solid #aaaaaa }',
        '.bold { font-weight: bold }',
        '.isUnknown { color: #aaaaaa }',
        '.isFound { color: #27ae60 }',
        'input.showMissing:checked { background: red }',
        'input.showMissing:checked ~ table .isFound {display: none !important; }',
    '</style>',
].join(' ');

var ENCODING = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
var FOOTER = '<br/><p>Uses data from Reddit\'s <a href="https://www.reddit.com/r/DestinyTheGame/comments/3lb4oo/calcified_fragments_sorted_by_location_and_videos/">Calcified fragments sorted by location and videos on how to obtain them</a> thread, compiled by <a href="https://reddit.com/u/BYF9">/u/BYF9</a> and the rest of the /r/destinythegame community. Site by <a href="http://twitter.com/joshhunt">joshhunt</a>.</p>';

var formatVideo = function(video) {
    if (!video) { return ''; }

    if (!video.match(/http/)) {
        return video;
    };

    return '<a target="_blank" href="' + video + '">Guide video</a>';
}

module.exports.results = function(data) {
    var fragments = data.fragments;

    var numOfFragments = Object.keys(fragments).length;
    var fragmentsFound = numOfFragments;

    var tableRows = fragments.map(function(frag) {

        var rowClasses = [
            frag.isUnknown ? 'isUnknown' : '',
            frag.hasCard ? 'isFound' : '',
        ].join(' ');

        if (!frag.hasCard) { fragmentsFound -= 1; }

        return [
            '<tr class=\'' + rowClasses + '\'>',
                '<td class=bold>' + frag.cardNo + '</td>',
                '<td>' + frag.cardName + '</td>',
                '<td>' + frag.guide.location + '</td>',
                '<td>' + frag.guide.activity + '</td>',
                '<td>' + formatVideo(frag.guide.video) + '</td>',
            '</tr>',
        ].join('\n');
    }).join('\n\n');

    var tableHeader = [
        '<tr class=bold>',
            '<td>No.</td>',
            '<td>Card</td>',
            '<td>Location</td>',
            '<td>Activity</td>',
            '<td>Video</td>',
        '</tr>',
    ].join('')

    var table = '<table>' + tableHeader + tableRows + '</table>';
    var heading = '<h1>Missing Calcified Fragments for ' + data.displayName + '</h1>';
    var fragmentSummary = '<p>Have ' + fragmentsFound + '/' + numOfFragments + ' fragments</p>';
    var viewSwitch = '<input type=checkbox class=showMissing id=missing checked /> <label for=missing >Show only missing fragments </label> <br/><br/>'

    return [
        ENCODING,
        STYLES,
        heading,
        fragmentSummary,
        viewSwitch,
        table,
        FOOTER,
    ].join(' ');
}

module.exports.error = function() {
    return [
        ENCODING,
        STYLES,
        '<h1>Error</h1>',
        '<h2>Could not get fragments for the user specified.</br>Please double check the username and console in the URL and try again.</h2>',
        FOOTER,
    ].join(' ');
}