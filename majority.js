var pList = document.getElementById('parties'),
	mList = document.getElementById('majorities'),
	others = document.getElementById('others'),
	mBox = document.getElementById('majority'),
	n = 1;
function button(id, cName) {
	document.getElementById(id).addEventListener('click', function(e) {
		document.body.classList.toggle(cName);
		e.preventDefault();
	})
}
button('show-colours', 'colours');
button('show-vote-share', 'vote-share');
document.body.addEventListener('input', majoritise);
function addParty(name, colour, seats) {
	var li = document.createElement('li');
	li.id = 'party-' + n;
	li.innerHTML = box('name', 'text', name) +
		box('colour', 'text', colour) +
		box('seats', 'number', seats) +
		box('vote share', 'number', seats, '%');
	pList.appendChild(li);
	var cBox = document.getElementById('colour-' + n);
	cBox.addEventListener('input', colourCBox);
	colourCBox();
	document.getElementById('name-' + n).addEventListener('input', function() {
		for (var i = 1; i < n; ++i)
			if (!document.getElementById('name-' + i).value)
				return;
		addParty();
	});
	++n;
	function colourCBox() { cBox.style.color = cBox.value; };
}
function box(label, type, value, after) {
	var lbl = label.replace(/ /g, ''),
		id = lbl + '-' + n;
	return '<div class="' + lbl + '">' +
				'<label for="' + id + '">' + label + '</label>' +
				'<input id="' + id +
					'" name="' + id +
					'" value="' + (value || '') +
					'" type="' + (type || 'text') + '">' +
				(after || '') + 
			'</div>';
}
addParty('Labour', 'red');
addParty('Conservatives', 'blue');
addParty('Lib Dems', '#f80');
addParty('Greens', '#4d4');
addParty('UKIP', 'purple');
addParty('SNP', '#dd0');
addParty('Plaid Cymru', 'green');
addParty();
majoritise();
mBox.addEventListener('input', majoritise);
function sort(a, b) {
	if (a.name == 'Everyone else') return 1;
	if (b.name == 'Everyone else') return -1;
	if (a.seats != b.seats) return b.seats - a.seats;
	if (a.name == b.name) return 0;
	return a.name > b.name ? 1 : -1;
}
function majoritise() {
	mList.innerHTML = '';
	var parties = [];
	for (var i = 1; i < n - 1; ++i)
		parties.push(read(['name', 'colour', 'seats', 'voteshare'], i));
	parties = parties.sort(sort).filter(function(a) { return a.name; });
	var seats = sum(parties, 'seats');
	if (seats < 650)
		parties.push({
			name: 'Everyone else',
			colour: 'gray',
			seats: 650 - seats
		});
	others.innerHTML = 650 - seats;
	var majority = parseFloat(mBox.value);
	build([]);
	function build(pre) {
		parties.forEach(function(next) {
			if (next.seats &&
				(!pre.length || (sort(next, pre[pre.length - 1]) > 0)) &&
				!~pre.indexOf(next)) {
				var now = pre.slice();
				now.push(next);
				var seats = sum(now, 'seats');
				if (seats >= majority) {
					var li = document.createElement('li'),
						pm = thing(now, seats);
					li.innerHTML = now.map(function(x) {
						return '<span style="color: ' + x.colour + '">' + x.name + '</span>';
					}).join(' + ') + ' = ' + seats +
						' <span class="voteshare">(' + sum(now, 'voteshare') + '%)</span> ' +
						(pm ? '<a href="' + pm + '" target="_blank">View PM</a>' : '');
					mList.appendChild(li);
				} else build(now);
			}
		});
	}
}
function sum(parties, k) {
	var seats = 0;
	parties.forEach(function(x) { if (x[k]) seats += x[k]; });
	return seats;
}
function read(p, i) {
	var x = { i: i };
	p.forEach(function(k) {
		var j = document.getElementById(k + '-' + i);
		x[k] = (j.type == 'number') ? parseFloat(j.value || '0') : j.value;
	});
	return x;
}
function thing(coalition, seats) {
	var pm = [0, 0, 0, 0, 0, 0, 0], ok = false;
	coalition.forEach(function(party) { if (party.i < 7) {
		pm[[null,1,0,2,3,4,5,6][party.i]] = party.seats / seats;
		ok = true;
	}});
	return ok && ('http://github.andrewt.net/thingometer#' + JSON.stringify(pm));
}