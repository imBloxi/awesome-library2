// Plot structures and prose templates for Babel Editions.
// A structure is an ordered list of beats; each beat has chapter titles and paragraph
// templates. Templates are filled by realize.mjs (see the slot list there).
// Rules for writers: past tense, third person, no new named characters, no new places
// beyond the world's, and nothing that contradicts the story state at that beat.

export const STRUCTURES = {
  crossing: ["open_home", "discovery", "rival_pressure", "decision", "threshold", "trial", "midpoint", "loss", "confrontation", "aftermath"],
  mystery: ["open_home", "discovery", "witness", "rival_pressure", "false_lead", "midpoint", "threshold", "loss", "confrontation", "aftermath"],
  return: ["open_return", "memory", "discovery", "rival_pressure", "witness", "midpoint", "loss", "decision", "confrontation", "aftermath"],
};

// What each beat leaves behind for later chapters to refer back to.
export const CALLBACKS = {
  discovery: ["the day {objS} turned up", "the first time {H} held {objS}"],
  rival_pressure: ["what {R} had said in {home}", "{R}'s offer"],
  threshold: ["the crossing at {pass}", "the first night beyond {pass}"],
  trial: ["the hard days in {away}", "the night {A} kept watch"],
  midpoint: ["what {objS} had finally shown", "the moment the pattern came clear"],
  loss: ["the night {objS} was taken", "everything that went wrong in {away}"],
  witness: ["what {E} had told {H.obj}", "{E}'s kitchen table"],
  memory: ["the summer {H} was twelve", "the last time the family was together"],
  false_lead: ["the wasted week", "the door that opened on nothing"],
  decision: ["the morning {H} chose to go", "the promise made to {A}"],
};

export const BEATS = {
  open_home: {
    titles: ["{home}", "An Ordinary {Season}", "The {Trade}"],
    paragraphs: [
      "In {home}, where there was always {sense}, {H.full} worked as a {H.trade}. It was steady work, and {H.subj} {H.was} good at it, which was the trouble: nobody in {home} expected anything else of {H.obj}.",
      "{Weather}. {H} had lived through enough of these days to know their shape: the early start, {sense}, the same faces at the same hour. Most people in a {homeKind} learned to call that peace. {H} had never managed it.",
      "What {H} wanted, and told no one, was {want}. It sat under every ordinary task like a stone under a floorboard, and on the bad days {H.subj} could feel it through {H.poss} shoes.",
      "{A}, who had known {H} since they were children, liked to say that {H} {flaw}. {A} said it fondly, which made it worse, because it was true.",
      "Evenings, {H} walked the long way home past the edge of {home}, where you could see toward {away}, and let {H.self} imagine. It was the kind of habit that looks harmless until the day it isn't.",
    ],
  },
  open_return: {
    titles: ["Coming Back to {home}", "The Road In", "What Was Left"],
    paragraphs: [
      "{H.full} had not been back to {home} in {yearsAway} years, and the {homeKind} had the decency to look smaller. {Weather}. At the gate there was {sense}, and for a moment {H.subj} {H.was} twelve again and in trouble.",
      "{H.Subj} had built a life elsewhere as a {H.trade}, a careful life with nothing in it that could be taken away. Coming back felt like walking into a room where everyone had stopped talking.",
      "{A} was waiting on the step, older and unsurprised. “You took your time,” {A} said, and then held on to {H.obj} for longer than either of them expected.",
      "Under the welcome, the old wish was still there: {want}. {H} had told {H.self} it was gone. It was not gone. It had only been waiting for {H.obj} to come home.",
    ],
  },
  discovery: {
    titles: ["{ObjS}", "What Turned Up", "A Thing That Should Not Exist"],
    paragraphs: [
      "It was {A} who found {obj}, wedged where no one would have thought to look, and it was {H} who understood, a beat too late to pretend otherwise, that it changed things.",
      "{H} turned {objS} over in {H.poss} hands. It was older than it had any right to be, and someone had taken care to keep it hidden. Whatever it pointed toward, it pointed toward {secret}.",
      "That night {H} could not sleep. Outside there was {sense}, ordinary as ever, and {objS} sat on the table like a question that had learned to wait.",
      "“Put it back,” {A} said. “Whatever it is, it was fine before you found it.” But {A} was already leaning closer to look.",
      "In daylight it looked less like an omen and more like what it was: {obj}, a little worn, a little ordinary. But ordinary things are the best hiding places. Everyone in {home} knew that, and everyone forgot it.",
    ],
  },
  rival_pressure: {
    titles: ["{R}", "An Offer", "The Price of Quiet"],
    paragraphs: [
      "{R}, {R.role}, came by the next morning with the smile of someone who had already decided how the conversation would end. Word of {objS} had travelled faster than {H} had thought possible.",
      "“I'll be plain,” {R} said. “That belongs to {home}, and {home} has managed very well without whatever you think it means. I can make it worth your while to forget it.”",
      "The offer was generous. That was what frightened {H}. Nobody paid that much for something worthless, and nobody threatened that softly unless they had done it before.",
      "After {R} left, {H} stood for a long time with {objS} in {H.poss} hand. {Weather}. Somewhere under the fear, {H.subj} noticed something else: for the first time in years, {H.subj} {H.was} not bored.",
      "{H} told {A} everything that afternoon. {A} listened without interrupting, which was how {H} knew {A.subj} {A.was} worried.",
    ],
  },
  decision: {
    titles: ["The Choice", "Before Morning", "A Promise to {A}"],
    paragraphs: [
      "In the end the choice took less time than the worrying had. {H} packed what {H.subj} could carry, left a note for no one in particular, and went to find {A}.",
      "“If you go, I go,” {A} said, and would not discuss it. {H} had expected an argument and was ashamed of how relieved {H.subj} felt.",
      "{E}, {E.role}, watched them make ready and said only one thing worth remembering: “Whatever is waiting out there has waited a long time. Don't hurry it, and don't let it hurry you.”",
      "It was {season}, the worst time to leave and, {H} suspected, the only time {H.subj} ever would.",
      "The last evening in {home} was strangely gentle. {Sense}, {sense}, and the light going slowly the way it does when you are paying attention for the last time.",
    ],
  },
  threshold: {
    titles: ["{Pass}", "Crossing Over", "The Far Side"],
    paragraphs: [
      "They {travel} out at first light. {Pass} was everything people said it was, and some things they had been too polite to mention. {Weather}, and {vessel} felt very small.",
      "By the second day {home} had shrunk to a rumor behind them. {H} kept checking that {objS} was safe, the way you touch a sore tooth, until {A} told {H.obj} to stop.",
      "When at last they reached {away}, it did not look like the end of anything. It looked like {awayKind} always looks to strangers: indifferent, beautiful, and full of people with reasons to lie.",
      "They talked, on the way, about everything except what waited at the end: old friends, bad weather, a song neither of them could remember the end of. It helped. Most things help a little, if you let them.",
    ],
  },
  trial: {
    titles: ["Hard Days", "In {away}", "What the Place Asked"],
    paragraphs: [
      "{away} did not welcome them. Doors closed when they asked their questions; prices doubled when they paid in coin from {home}. {Sense}, everywhere, and nowhere a friendly face.",
      "There was a night when {threat} came close enough to touch, and {H} learned what {H.subj} {H.was} made of, which turned out to be less than {H.subj} had hoped and more than {H.subj} had feared.",
      "{A} kept watch while {H} slept, and in the morning neither of them mentioned it. Some debts are paid by not being spoken.",
      "“We could still go back,” {A} said once, very quietly. {H} did not answer, and that was an answer.",
      "{H} learned the small rules of {away}: which doors could be knocked on, which questions could be asked aloud, and which could only be asked with money.",
    ],
  },
  midpoint: {
    titles: ["The Pattern", "What {ObjS} Showed", "Halfway"],
    paragraphs: [
      "It came clear all at once, the way the hardest things do. {H} had been reading {objS} wrong from the start. It was not a puzzle; it was a confession, and it led straight to {secret}.",
      "{H} sat back and laughed, a short unhappy sound. Everything {R} had said made a different kind of sense now. So did the softness of the threat.",
      "“You know what this means,” {A} said. It was not a question. Knowing was a door that only opened one way, and they were both through it.",
      "They sat up the rest of the night going over it again and again, and every time it came out the same. {Weather}, and neither of them noticed.",
    ],
  },
  loss: {
    titles: ["The Worst Night", "Taken", "What It Cost"],
    paragraphs: [
      "They came for {objS} on the darkest night of {season}. By the time {H} woke, it was gone, and so was the certainty {H.subj} had built around it.",
      "{A} was hurt, not badly, but badly enough that {H} could not pretend any longer this was a story about {H.self}. {Weather}. {H} sat beside {A} until morning and understood exactly what {H.poss} wanting had cost.",
      "There is a particular silence after a mistake that cannot be undone. {H} listened to it for a long time. Then, because there was nothing else to do, {H.subj} began to plan.",
      "\u201cThis isn't your fault,\u201d {A} said, which was generous and not entirely true, and they both knew it, and {H} was grateful anyway.",
    ],
  },
  witness: {
    titles: ["{E}", "An Old Account", "The One Who Remembered"],
    paragraphs: [
      "{E}, {E.role}, had been waiting for someone to ask. The tea was already poured when {H} arrived, and {E} looked at {objS} the way one looks at an old enemy grown frail.",
      "“I was there,” {E} said. “Not at the centre of it. Nobody honest was at the centre of it. But I was close enough to know that what they told you about {secret} was a kindness, and kindnesses are not always true.”",
      "{E} told the rest slowly, with long pauses in which there was only {sense}. {H} wrote nothing down. Some things you are only trusted to remember.",
      "When {H} rose to leave, {E} held on to {H.poss} sleeve for a moment. \u201cBe careful who you tell,\u201d {E} said. \u201cNot because they'll stop you. Because some of them will thank you, and you won't know what to do with that.\u201d",
    ],
  },
  memory: {
    titles: ["Twelve Years Old", "Before", "The Last Summer"],
    paragraphs: [
      "The summer {H} was twelve, the whole family had been in {home} together for the last time. {H} remembered {sense}, and laughter from the kitchen, and a door that was always kept shut.",
      "{R} had been there too, younger then, and already better than anyone at deciding what other people were allowed to know.",
      "Memory is not a record; it is a story we keep telling until it becomes true. Standing in the old rooms now, {H} began to suspect that {H.poss} own story had been edited by someone else.",
      "{H} went from room to room touching things, the banister, the cold stove, a doorframe still notched with old heights, as if the house might answer if asked the right way.",
    ],
  },
  false_lead: {
    titles: ["The Wrong Door", "A Wasted Week", "Nothing There"],
    paragraphs: [
      "They spent a week following the obvious answer, and the obvious answer led to an empty room. {H} stood in the dust of it and felt the hours drain out of {H.obj}.",
      "“It was meant to look like this,” {A} said. “Someone wanted us tired.” It was the first sensible thing either of them had said in days.",
      "{H} went back to {objS} and started again from the beginning. This time {H.subj} read what was missing as carefully as what was there.",
      "There was a kind of gift in failure, {H} decided later. It cleared away the answers you wanted, and left you alone with the one that was true.",
    ],
  },
  confrontation: {
    titles: ["Face to Face", "{R}'s Account", "The Truth, Out Loud"],
    paragraphs: [
      "{H} found {R} where {H.subj} had known {R.subj} would be, and for once {R} did not smile. {Weather}. Everything that had been said quietly for years was finally going to be said out loud.",
      "“You think this makes you brave,” {R} said. “It makes you the person who broke something that was holding.” {H} had rehearsed a hundred answers. In the end {H.subj} only said the truth about {secret}, plainly, and watched it land.",
      "{R} was not a monster. That was the hardest part. {R} was someone who had made one convenient choice and then defended it for the rest of a life, and {H} could see, with a kind of horror, how easy that would be.",
      "For a long moment neither of them moved. {Sense}. Somewhere far off, the ordinary day went on without them.",
    ],
    endings: {
      kept: "When it was over, {objS} was back in {H.poss} hands. {H} did not feel victorious. {H.Subj} felt responsible, which was heavier and, {H.subj} suspected, more useful.",
      given: "When it was over, {H} did the one thing {R} had never imagined: {H.subj} gave {objS} away, to {home}, to everyone, so that no single person could ever own it again.",
      released: "When it was over, {H} let {objS} go. Some truths, {H.subj} decided, are better held by the people they hurt than paraded in front of the people they don't.",
    },
  },
  aftermath: {
    titles: ["After", "{home}, Again", "What Remained"],
    paragraphs: [
      "{Season} came round again, as it always does. {home} was the same and not the same; there was still {sense}, but people looked at {H} differently now, and {H} looked back.",
      "{A} healed, mostly. On the good days they talked about {cb} as if it had happened to other people. On the bad days they did not talk at all, and that was allowed too.",
      "{H} had not got what {H.subj} wanted, exactly. {H.Subj} had wanted {want}. What {H.subj} had got instead was harder to name: a life with the doors open.",
      "{E} came by once, near the end of {season}, and looked at {H} for a long time. \u201cWell,\u201d {E} said at last. \u201cYou didn't hurry it.\u201d It was the closest thing to praise {H} ever got from {E}, and {H} kept it.",
    ],
    endings: {
      kept: "Some nights {H} still took out {objS} and turned it over in the lamplight. It did not ask anything of {H.obj} anymore. It only reminded {H.obj} that {H.subj} had once been brave, and could be again.",
      given: "In time the story of {secret} became part of the town's story, told wrong and retold, argued over in kitchens. {H} found {H.subj} did not mind. A truth that belongs to everyone is allowed to be untidy.",
      released: "Nobody in {home} ever learned the whole of it. {H} carried what {H.subj} knew lightly, the way you carry a stone from a beach: not as a burden, but as proof that you were there.",
    },
  },
};

// Place and work: the world doing its ordinary business around the story.
export const SCENES = [
  "The work did not stop for anyone's troubles. {H} did what a {H.trade} does, hands busy and head elsewhere, while {sense} and {sense} went on around {H.obj} as they always had.",
  "By noon {weather}. People hurried past with their own concerns, and {H} envied them a little: the plainness of their errands, the way none of them was carrying {objS}.",
  "Every {homeKind} has its hour when everyone is out at once. {H} moved through it carefully, nodding to faces {H.subj} half knew, listening for {R}'s name and hearing it twice.",
  "There was a bench where {H} liked to sit and think, and {H.subj} sat there now for a long while. {Sense}. A child ran past chasing something only the child could see.",
  "{A} brought food wrapped in paper and made {H} eat it. \u201cYou're no use to anyone hungry,\u201d {A} said, which was the sort of practical tenderness {A} specialized in.",
  "Rumors moved through the place like weather. Some said {R} was worried; some said {R} was never worried; one old voice said {secret} was nothing new and everyone over sixty knew it.",
  "{H} went over {objS} again at the kitchen table, slowly, by lamplight, the way {E} had once taught {H.obj} to look at things: as if they might still change their minds.",
  "The evening came down soft and early. {Sense} gave way to {sense}, and lights went on in windows one by one, each of them someone else's ordinary life.",
  "There were errands to run, and {H} ran them, grateful for small tasks with clear ends. Bread. A borrowed tool returned. A conversation about the weather, in which {weather} was agreed upon by everyone.",
  "At the edge of {home} the road ran on toward {away}, as it always had. {H} stood looking at it for a while. Roads are only promises, {H.subj} thought, and promises are only roads.",
  "{H} slept badly and dreamed of {objS}, and of a door that opened onto {sense}. In the morning {H.subj} could not remember what had been waiting behind it, only that it had known {H.poss} name.",
  "Someone had left flowers at the old marker on the corner, as someone always did, though nobody would admit to it. {H} had passed them a thousand times. Today {H.subj} stopped.",
];

// Paragraphs that can sit in any chapter: weather and texture, reflection, conversation.
export const INTERLUDES = [
  "Nobody tells you how much of any story is simply getting through the day. {H} ate when {H.subj} remembered to, slept badly, and woke each morning to {sense}, as if the world had not noticed anything had changed.",
  "{A} found {H} at the window long after midnight. Neither of them said anything. Outside, {weather}, and the not-saying was a kind of company.",
  "{H} made lists, because lists were something to hold. What was known. What was only feared. What {R} wanted, and what {R} had been careful never to say.",
  "There is a tiredness that sleep does not reach. {H} carried it everywhere now, the way {H.subj} carried {objS}: close, and with a care that was almost tenderness.",
  "Somewhere a door banged in the wind and {H} flinched, and then was ashamed of flinching. {Weather}, and after that there was only {sense}.",
  "{H} caught {H.poss} reflection in a dark pane of glass and did not, for a moment, recognize the person looking back. It was not an unpleasant feeling. It was only new.",
  "In the evenings {A} told stories, mostly untrue and always better for it, and {H} let them wash over {H.obj}. Beyond the walls there was {sense}, as there always was.",
  "It would have been easy to stop. {H} kept noticing how easy. That was the strange part: the way the easy road stayed open beside the hard one, the whole way, patient as a dog.",
  "{H} wrote a letter to no one and burned it. The words had needed to exist for a little while; they did not need to last.",
  "The days found a rhythm. {Sense} at waking, {sense} at dusk, and in between the slow work of not giving up.",
  "Once, without warning, {H} thought of {E}, and of a thing {E} had said years ago that had made no sense at the time. It made a little more sense now.",
  "{H} was not a brave person. {H.Subj} had always known that about {H.self}. But it turned out bravery was less a quality than a habit, and habits can be learned late.",
  "Sometimes {H} wondered what {R} was doing at that exact moment, and whether {R} ever lay awake, too. It was an uncomfortable thing to wonder. It made {R} into a person.",
  "Over breakfast {A} said, out of nowhere, \u201cYou've changed.\u201d {H} asked whether that was good. {A} considered it, honestly, the way {A.subj} considered everything. \u201cAsk me at the end.\u201d",
  "{Weather}. {H} stood still long enough to notice {sense}, and to wonder when {H.subj} had stopped noticing things like that.",
  "There were hours when nothing happened at all, when {sense} and the slow turning of the day made up the whole of the world. {H} had once found such hours unbearable. Now {H.subj} held on to them.",
  "{A} had a way of humming when {A.subj} {A.was} worried, and {A.subj} hummed a great deal in those days. {H} pretended not to hear, which was its own kind of kindness.",
  "Later, {H} would remember this part less clearly than the rest: the waiting, {sense}, the feeling of standing at the edge of something without yet knowing its name.",
  "{H} thought about {cb}, and about how certain {H.subj} had been then, and how little that certainty had turned out to weigh.",
  "It occurred to {H}, not for the first time, that {H.subj} {flaw}. Knowing it did not seem to help. Perhaps it was not supposed to.",
];

export const DIALOGUES = [
  ["\u201cYou don't have to do this alone,\u201d {A} said.", "\u201cI know.\u201d", "\u201cDo you? Because you keep doing it.\u201d"],
  ["\u201cWhat would {E} say, if {E.subj} saw us now?\u201d", "{H} thought about it. \u201cSomething kind and completely useless.\u201d", "\u201cSo, the usual.\u201d", "\u201cThe usual.\u201d"],
  ["\u201cI keep thinking about {R},\u201d {H} said.", "\u201cDon't,\u201d {A} said. \u201cThat's what {R.subj} wants.\u201d", "\u201cNo. That's what scares me. I don't think {R.subj} wants anything from me at all.\u201d"],
  ["\u201cWhat's the first thing you'll do,\u201d {A} asked, \u201cwhen this is over?\u201d", "\u201cSleep for a week.\u201d", "\u201cAnd then?\u201d", "{H} found that {H.subj} did not know, and that not knowing felt, for once, like room."],
  ["\u201cDo you trust me?\u201d {H} asked.", "{A} didn't answer right away, which was how {H} knew the answer would be true when it came. \u201cMore than I trust you to look after yourself.\u201d"],
  ["\u201cIt's late,\u201d {A} said.", "\u201cIt's been late for a long time.\u201d", "\u201cThat's very poetic. Go to bed.\u201d"],
  ["\u201cWhy you?\u201d {A} asked once. \u201cOf everyone in {home}. Why did it have to be you who found it?\u201d", "\u201cI don't think it had to be,\u201d {H} said. \u201cI think I'm just the one who didn't put it back.\u201d"],
  ["“Are you frightened?” {A} asked.", "“Yes,” {H} said. “Are you?”", "“Only of turning back.”"],
  ["“You could have told me,” {A} said.", "“I didn't know how.”", "“That's never once stopped you from talking before.”", "{H} laughed despite {H.self}, and some of the weight went out of the evening."],
  ["“What will you do if it's true?” {A} asked.", "{H} took a long time to answer. “I suppose I'll have to stop pretending I didn't know.”"],
  ["“Tell me about {home},” {A} said, “the way you'd tell a stranger.”", "So {H} did, and found that {H.subj} loved it more in the telling than {H.subj} ever had in the living."],
  ["“Do you ever wish you'd never found it?”", "“Every day,” {H} said. “And then I look at it again.”"],
];
