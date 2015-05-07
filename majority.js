var pList = document.getElementById('parties'),
	mList = document.getElementById('majorities'),
	others = document.getElementById('others'),
	mBox = document.getElementById('majority'),
	everyoneBox = document.getElementById('include-everyone-else'),
	majorityLine = document.getElementById('majority-line'),
	n = 1;

everyoneBox.addEventListener('change',majoritise);
mBox.addEventListener('change',majoritise);

function button(id, cName) {
	document.getElementById(id).addEventListener('click', function(e) {
		document.body.classList.toggle(cName);
		e.preventDefault();
	})
}
function box(party,label, type, value, after, callback) {
	var slug = label.replace(/ /g, '-');

	var div = document.createElement('div');
	div.className = slug;

	var label_tag = document.createElement('label');
	div.appendChild(label_tag);
	label_tag.textContent = label+': ';

	var input = document.createElement('input');
	label_tag.appendChild(input);
	input.value = value || '';
	input.type = type || 'text';

	input.addEventListener('change',function() {
		var value = this.value;
		if(type=='number') {
			value = parseFloat(value || '0');
		}
		callback.apply(party,[value,true]);
	});

	if(after!==undefined) {
		label_tag.appendChild(document.createTextNode(after));
	}

	return div;
}

button('show-colours', 'colours');
button('show-vote-share', 'vote-share');

var all_parties = [];
function Party(name,colour,seats) {
	this.n = n++ - 1;
	this.setName(name);
	this.setColour(colour);
	this.setSeats(seats);
}
Party.prototype = {
	makeHTML: function() {
		var party = this;

		var li = this.html = document.createElement('li');
		pList.appendChild(li);

		li.id = 'party-' + this.n;
		li.appendChild(box(this,'name', 'text', this.name,'',this.setName));
		li.appendChild(box(this,'colour', 'text', this.colour,'',this.setColour));
		li.appendChild(box(this,'seats', 'number', this.seats,'',this.setSeats));
		li.appendChild(box(this,'vote share', 'number', this.seats, '%'));

		this.displayName();
		this.displaySeats();
		this.displayColour();
	},
	
	setName: function(name,interactive) {
		this.name = name;

		if(interactive) {
			if(all_parties.filter(function(party) {	return !party.name; }).length) {
				return;
			} else {
				addParty();
			}
			majoritise();
		}
		this.displayName();
	},

	displayName: function() {
		if(!this.html) {
			return;
		}
		this.html.querySelector('.name input').value = this.name || '';
	},

	setColour: function(colour,interactive) {
		this.colour = colour;
		if(interactive) {
			majoritise();
		}
	},

	displayColour: function() {
		if(!this.html) {
			return;
		}
		this.html.querySelector('.colour input').style.color = this.colour;
		this.html.querySelector('.colour input').value = this.colour || '';
	},

	setSeats: function(seats,interactive) {
		this.seats = seats;
		if(interactive) {
			majoritise();
		}
		this.displaySeats();
	},

	displaySeats: function() {
		if(!this.html) {
			return;
		}
		this.html.querySelector('.seats input').value = this.seats;
	}
}

function addParty(name,colour,seats) {
	var p = new Party(name,colour,seats);

	p.makeHTML();

	all_parties.push(p);
}

var party_data = [
	{name: 'Labour', colour: 'red'},
	{name: 'Conservatives', colour: 'blue'},
	{name: 'Lib Dems', colour: '#f80'},
	{name: 'Greens', colour: '#4d4'},
	{name: 'UKIP', colour: 'purple'},
	{name: 'SNP', colour: '#dd0'},
	{name: 'Plaid Cymru', colour: 'green'}
];
party_data.forEach(function(p){
	addParty(p.name,p.colour);
})
addParty();
majoritise();

function sort_parties(a, b) {
	if (a.name == 'Everyone else') return 1;
	if (b.name == 'Everyone else') return -1;
	if (a.seats != b.seats) return b.seats - a.seats;
	if (a.name == b.name) return 0;
	return a.name > b.name ? 1 : -1;
}

function sum(coalition, property) {
	var seats = 0;
	coalition.forEach(function(x) { 
		if (x[property]) {
			seats += x[property]; 
		}
	});
	return seats;
}

function majoritise() {
	var parties = all_parties.slice().sort(sort_parties).filter(function(a) { return a.name; });

	var seats = sum(parties, 'seats');

	var include_everyone_else = everyoneBox.checked;

	var everyone_else = new Party('Everyone else','gray',650 - seats);
	if (seats < 650 && include_everyone_else) {
		parties.push(everyone_else);
	}

	var majority = parseFloat(mBox.value);

	function find_majority(parties,target) {
		var coalitions = parties.map(function(party,i) {
			if(!party.seats) {
				return [];
			}
			if(party.seats>=target) {
				return [{parties: [party], seats: party.seats, opposition: parties.slice(0,i).concat(parties.slice(i+1))}];
			} else {
				var coalitions = find_majority(parties.slice(i+1),target-party.seats);
				return coalitions.map(function(coalition){ 
					coalition.parties.splice(0,0,party); 
					coalition.seats += party.seats;
					coalition.opposition = parties.slice(0,i).concat(coalition.opposition);
					return coalition; 
				});
			}
		});
		return Array.prototype.concat.apply([],coalitions);
	}
	var majorities = find_majority(parties,majority);

	function sort_majorities(a,b) {
		if(a.seats!=b.seats) {
			return a.seats < b.seats ? 1 : a.seats>b.seats ? -1 : 0;
		}
		var a_leader = a.parties[0].seats;
		var b_leader = b.parties[0].seats;
		if(a_leader==b_leader) {
			var a_parties = a.parties.length;
			var b_parties = b.parties.length;
			return a_parties>b_parties ? 1 : a_parties<b_parties ? -1 : 0;
		} else {
			return a_leader < b_leader ? 1 : -1;
		}
	}

	majorities.sort(sort_majorities);

	others.innerHTML = everyone_else.seats;

	mList.innerHTML = '';

	majorityLine.style.left = (90*majority/650)+'%';

	majorities.forEach(function(coalition) {
		var li = document.createElement('li');
		mList.appendChild(li);

		var chart = document.createElement('span');
		li.appendChild(chart);
		chart.className = 'chart';
		//chart.style.width = (100*coalition.seats/650)+'%';
		coalition.parties.forEach(function(party) {
			var bar = document.createElement('span');
			chart.appendChild(bar);
			bar.className = 'bar';
			bar.setAttribute('title',party.name);
			bar.style.background = party.colour || 'black';
			bar.style.width = (90*party.seats/650)+'%';
		});
		var middle = document.createElement('span');
		chart.appendChild(middle);
		middle.className = 'bar middle';
		coalition.opposition.forEach(function(party) {
			if(!party.seats) {
				return;
			}
			var bar = document.createElement('span');
			chart.appendChild(bar);
			bar.className = 'bar';
			bar.setAttribute('title',party.name);
			bar.style.background = party.colour || 'black';
			bar.style.width = (90*party.seats/650)+'%';
		});

		var pm = pm_link(coalition.parties, coalition.seats);

		var party_names = coalition.parties.map(function(x) {
			return '<span style="color: ' + x.colour + '">' + x.name + ' ('+x.seats+')</span>';
		}).join(' + ');

		var total_vote_share = sum(coalition.parties, 'voteshare');
		var vote_share = total_vote_share>0 ? ' <span class="voteshare">(' + total_vote_share + '%)</span> ' : '';

		li.innerHTML +=  '<span class="info">' + party_names + ' = ' + coalition.seats + vote_share + pm + '</span>';
	});
}
function pm_link(coalition, seats) {
	var pm = [0, 0, 0, 0, 0, 0, 0];
	var ok = false;
	coalition.forEach(function(party) { if (party.n < 7) {
		pm[[1,0,2,3,4,5,6][party.n]] = party.seats / seats;
		ok = true;
	}});

	if(ok) {
		var url = 'http://github.andrewt.net/thingometer#' + JSON.stringify(pm);
		return '<a class="btn" href="' + url + '" target="_blank">View PM</a>';
	} else {
		return '';
	}
}
