// Plot structures and prose templates for Babel Editions.
// A structure is an ordered list of beats; each beat has chapter titles and paragraph
// templates. Templates are filled by index.mjs (see the slot list there).
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
  loss: ["the night {objS} {objWere} taken", "the empty hiding place"],
  witness: ["what {E} had told {H.obj}", "{E}'s kitchen table"],
  memory: ["the summer {H} was twelve", "the last time the family was together"],
  false_lead: ["the wasted week", "the door that opened on nothing"],
  decision: ["the plan they made together", "the promise made to {A}"],
};

export const BEATS = {
  open_home: {
    titles: ["{home}", "Before the Change", "The {Trade}"],
    paragraphs: [
      "In {home}, amid {sense}, {H.full} worked as {H.article} {H.trade}. It was steady work, and {H.subj} {H.was} good at it, which was the trouble: nobody in {home} expected anything else of {H.obj}.",
      "{Weather}. {H} had lived through enough of these days to know their shape: the early start, {sense}, the same faces at the same hour. Most people in {homeArticle} {homeKind} learned to call that peace. {H} had never managed it.",
      "What {H} wanted, and told no one, was {want}. It sat under every ordinary task like a stone under a floorboard, and on the bad days {H.subj} could feel it through {H.poss} shoes.",
      "{A}, who had known {H} since they were children, liked to say that {H} {flaw}. {A} said it fondly, which made it worse, because it was true.",
      "Evenings, {H} walked the long way home past the edge of {home}, where you could see toward {away}, and let {H.self} imagine. It was the kind of habit that looks harmless until the day it isn't.",
    ],
  },
  open_return: {
    titles: ["Coming Back to {home}", "The Road In", "What Was Left"],
    paragraphs: [
      "{H.full} had not been back to {home} in {yearsAway} years, and the {homeKind} had the decency to look smaller. {Weather}. At the entrance, {H.subj} paused, taking in {sense}, and for a moment {H.subj} {H.was} twelve again and in trouble.",
      "{H.Subj} had built a life elsewhere as {H.article} {H.trade}, a careful life with nothing in it that could be taken away. Coming back felt like walking into a room where everyone had stopped talking.",
      "{A} was waiting on the step, older and unsurprised. “You took your time,” {A} said, and then held on to {H.obj} for longer than either of them expected.",
      "Under the welcome, the old wish was still there: {want}. {H} had told {H.self} it was gone. It was not gone. It had only been waiting for {H.obj} to come home.",
    ],
  },
  discovery: {
    titles: ["{ObjS}", "What Turned Up", "A Thing That Should Not Exist"],
    paragraphs: [
      "{H} found {obj}, wedged where no one would have thought to look. {A} was there when {H.subj} drew {objThem} out. Neither spoke at first; then {H} understood, a beat too late to pretend otherwise, that it changed things.",
      "{H} turned {objS} over in {H.poss} hands. {ObjThey} {objWere} older than either of them had expected, and someone had taken care to keep {objThem} hidden. The discovery raised a question about {secret}.",
      "That night {H} could not sleep. Beyond the room, life continued: {sense}, ordinary as ever, and {objS} sat on the table like a question that had learned to wait.",
      "“Put {objThem} back,” {A} said. “Whatever this means, we were better off before you found {objThem}.” But {A} was already leaning closer to look.",
      "In daylight the find looked less like an omen and more like what it was: {obj}, a little worn, a little ordinary. But ordinary things are the best hiding places. Everyone in {home} knew that, and everyone forgot it.",
    ],
  },
  rival_pressure: {
    titles: ["{R}", "An Offer", "The Price of Quiet"],
    paragraphs: [
      "{R}, {R.role}, came by the next morning with the smile of someone who had already decided how the conversation would end. Word of {objS} had travelled faster than {H} had thought possible.",
      "“I'll be plain,” {R} said. “That belongs to {home}, and {home} has managed very well without whatever you think it means. I can make it worth your while to forget it.”",
      "The offer was generous. That was what frightened {H}. Nobody paid that much for something worthless, and nobody threatened that softly unless they had done it before.",
      "After {R} left, {H} stood for a long time with {objS} laid out before {H.obj}. {Weather}. Somewhere under the fear, {H.subj} noticed something else: for the first time in years, {H.subj} {H.was} not bored.",
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
    variants: {
      return: [
        "{H} put the surviving copy of the statement on the table. Leaving {home} again would have been easy. This time {H.subj} meant to stay until {R} had answered for it.",
        "“If you go to see {R}, I go with you,” {A} said. {H} had expected an argument and was ashamed of how relieved {H.subj} felt.",
        "{E} helped them put the events in order, checking each date twice. They agreed to speak plainly and to keep a second copy somewhere safe.",
        "Before they left the room, {H} looked once more at the familiar walls. The old wish, {want}, had brought {H.obj} back. What happened next would decide whether {H.subj} could stay.",
      ],
    },
  },
  threshold: {
    titles: ["{Pass}", "Crossing Over", "The Far Side"],
    paragraphs: [
      "They set out for {away}, carrying what they could. Reaching {pass} felt like the first real break with the life they had left behind. {Weather}. {H} checked the route again rather than admit how unsure {H.subj} felt.",
      "By the time they reached the far side, {home} had shrunk to a rumor behind them. {H} kept checking that {objS} {objWere} safe, the way you touch a sore tooth, until {A} told {H.obj} to stop.",
      "When at last they reached {away}, it did not look like the end of anything. To strangers it had the look of {awayKind}: indifferent, beautiful, and full of people with reasons to lie.",
      "On the way they had talked about everything except what waited at the end: old friends, bad weather, a song neither of them could remember the end of. It had helped. Now word reached them that {R} had arrived ahead of them, and the small comfort of the journey fell away.",
    ],
  },
  trial: {
    titles: ["Hard Days", "In {away}", "What the Place Asked"],
    paragraphs: [
      "{away} did not welcome them. Doors closed when they asked their questions; the simplest requests took hours, and nobody seemed to have the key to the room they needed. {Sense}, everywhere, and nowhere a friendly face.",
      "One night someone searched their room while they were out. Nothing was missing, but the folded clothes lay in a different order. {H} learned how little a closed door could promise.",
      "{A} kept watch while {H} slept, and in the morning neither of them mentioned it. Some debts are paid by not being spoken.",
      "“We could still go back,” {A} said once, very quietly. {H} did not answer, and that was an answer.",
      "{H} learned the small rules of {away}: which doors could be knocked on, which questions could be asked aloud, and which could only be asked with money.",
    ],
  },
  midpoint: {
    titles: ["The Pattern", "What {ObjS} Showed", "Halfway"],
    paragraphs: [
      "The answer was in a dated statement in the public records. {H} checked it against {objS} and the accounts they had collected. The details agreed. {Truth}",
      "{H} sat back and laughed, a short unhappy sound. Everything {R} had said made a different kind of sense now. So did the softness of the threat.",
      "“You know what this means,” {A} said. It was not a question. Knowing was a door that only opened one way, and they were both through it.",
      "They made two copies of the statement and checked each one against the original. {H} kept one and gave the other to {A}. For the first time, the evidence could survive being taken from either of them.",
    ],
  },
  loss: {
    titles: ["The Worst Night", "Taken", "What It Cost"],
    paragraphs: [
      "Someone forced the lock while {H} slept. By the time {H} woke, {objS} {objWere} gone. The copy of the statement was still inside {H.poss} coat; whoever had searched the room had not known to look for it.",
      "{A} was hurt, not badly, but badly enough that {H} could not pretend any longer this was a story about {H.self}. {Weather}. {H} sat beside {A} until morning and understood exactly what {H.poss} wanting had cost.",
      "There is a particular silence after a mistake that cannot be undone. {H} listened to it for a long time. Then, because there was nothing else to do, {H.subj} began to plan.",
      "\u201cThis isn't your fault,\u201d {A} said, which was generous and not entirely true, and they both knew it, and {H} was grateful anyway.",
    ],
  },
  witness: {
    titles: ["{E}", "An Old Account", "The One Who Remembered"],
    paragraphs: [
      "{E}, {E.role}, had been waiting for someone to ask. The tea was already poured when {H} arrived. When {H} set down {objS}, {E} took a long time to answer the first question.",
      "“I was there,” {E} said. “Not at the centre of it. Nobody honest was at the centre of it. But I was close enough to know an account was filed before anyone began changing the story. Find that account. Memory is useful, but you will need something you can put on a table.”",
      "{E} told the rest slowly, with long pauses in which there was only {sense}. {H} wrote nothing down. Some things you are only trusted to remember.",
      "When {H} rose to leave, {E} held on to {H.poss} sleeve for a moment. \u201cBe careful who you tell,\u201d {E} said. \u201cNot because they'll stop you. Because some of them will thank you, and you won't know what to do with that.\u201d",
    ],
  },
  memory: {
    titles: ["Twelve Years Old", "Before", "The Last Summer"],
    paragraphs: [
      "When {H} was twelve, the whole family had been in {home} together for the last time. {H} remembered {sense}, and laughter from the kitchen, and a door that was always kept shut.",
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
      "{H} went back to {objS} and started again from the beginning. This time {H.subj} compared the small details with the notes from their visits, looking for what the first explanation had left out.",
      "There was a kind of gift in failure, {H} decided later. It cleared away the answers you wanted, and left you alone with the one that was true.",
    ],
  },
  confrontation: {
    titles: ["Face to Face", "{R}'s Account", "The Truth, Out Loud"],
    paragraphs: [
      "{H} found {R} where {H.subj} had known {R.subj} would be, and for once {R} did not smile. {Weather}. Everything that had been said quietly for years was finally going to be said out loud.",
      "“You think this makes you brave,” {R} said. “It makes you the person who broke something that was holding.” {H} put the copied statement on the table and read its conclusion aloud. {Truth} {H} let {R} read it too. “There is another copy. Taking this one will not change what happened.”",
      "{R} was not a monster. That was the hardest part. {R} was someone who had made one convenient choice and then defended it for the rest of a life, and {H} could see, with a kind of horror, how easy that would be.",
      "For a long moment neither of them moved. Then {R} opened a locked drawer. {H} recovered {objS} and checked {objThem} carefully before stepping back. {R} had run out of offers; the other copy of the statement had seen to that.",
    ],
    endings: {
      kept: "When it was over, {H} chose to keep {objS}. {H} did not feel victorious. {H.Subj} felt responsible, which was heavier and, {H.subj} suspected, more useful.",
      given: "When it was over, {H} did the one thing {R} had never imagined: {H.subj} placed {objS} and a copy of the statement in the public archive. Anyone could ask to see the evidence now; no single person could make it disappear.",
      released: "Once back in {home}, {H} placed {objS} and the statement in {E}'s care, to be shared first with the people whose lives the account had changed. {H} had carried the evidence far enough.",
    },
  },
  aftermath: {
    titles: ["After", "{home}, Again", "What Remained"],
    paragraphs: [
      "By the time another year had passed, {H} and {A} were settled in {home} again. The place was the same and not the same; there was still {sense}, but people looked at {H} differently now, and {H} looked back.",
      "{A} healed, mostly. On the good days they talked about {cb} as if it had happened to other people. On the bad days they did not talk at all, and that was allowed too.",
      "{H} had not got what {H.subj} wanted, exactly. {H.Subj} had wanted {want}. What {H.subj} had got instead was harder to name: a life with the doors open.",
      "One afternoon {E} came by and looked at {H} for a long time. \u201cWell,\u201d {E} said at last. \u201cYou saw it through.\u201d It was the closest thing to praise {H} ever got from {E}, and {H} kept it.",
    ],
    endings: {
      kept: "Some nights {H} still took out {objS} and turned {objThem} over in the lamplight. {ObjThey} did not ask anything of {H.obj} anymore. {ObjThey} only reminded {H.obj} that {H.subj} had once been brave, and could be again.",
      given: "In time the account in the archive became part of the place's story, told wrong and retold, argued over in doorways. {H} found {H.subj} did not mind. A truth that belongs to everyone is allowed to be untidy.",
      released: "The people who needed the statement had read it before it became anyone else's story. {H} carried what {H.subj} knew lightly, the way you carry a stone from a beach: not as a burden, but as proof that you were there.",
    },
  },
};

// Supporting scenes follow the completed beat. Conditions describe what the coda
// needs; index.mjs deals each entry once and never interrupts mandatory action.
const scene = (text, when) => ({ lines: [text], when });
const discovered = (state) => state.discovered;
const holding = (state) => state.hasObject;
const pressure = (state) => state.metRival && !state.finished;
const home = (state, bible) => state.place === bible.slots.home;

export const SCENES = [
  scene("The work did not stop for anyone's troubles. {H} returned to the small tasks of {H.poss} trade, hands busy and head elsewhere. Familiar work offered no answers, but it gave {H.obj} something that could be finished.", home),
  scene("{H} paused to take in {sense}. People went about their own concerns nearby, and {H} envied the plainness of their errands. None of them seemed to be wondering what a closed door might hide."),
  scene("In {place}, people had learned to notice strangers without seeming to. {H} listened longer than {H.subj} spoke, and came away knowing which questions made a conversation stop.", pressure),
  scene("There was a quiet place to sit, and {H} stayed there until {H.poss} thoughts became less hurried. There was more to do. It still helped to let the world be larger than the problem."),
  scene("{A} brought food wrapped in paper and made {H} eat it. “You're no use to anyone hungry,” {A} said. {H} finished the food before trying to answer; for once, that seemed the right order."),
  scene("Rumors had given {R} a dozen different intentions. {H} wrote down only what {H.subj} had heard directly and crossed out the rest. The page became much shorter, and considerably more useful.", pressure),
  scene("{H} examined {objS} once more, slowly, making a note of each detail instead of trusting memory. The plain act of description kept drawing {H.obj} back from the explanations {H.subj} wanted to believe.", holding),
  scene("There were errands to run, and {H} ran them, grateful for small tasks with clear ends. A borrowed tool returned. A message delivered. Ordinary obligations still expected to be met.", home),
  scene("{H} looked toward the way out of {home}, considering how little anyone would ask if {H.subj} simply left. Then {H.subj} turned back. Staying was a decision, even when it looked like standing still.", home),
  scene("With {objS} out of reach, {H} listed the details {H.subj} could still remember. It was a poor substitute for the thing itself. Beside the list, {A} added two details {H} had missed.", state => state.discovered && !state.hasObject),
  scene("{H} and {A} compared their notes. Where their memories differed, they left a space instead of choosing the more convenient version. They would have to ask again, and listen better.", discovered),
  scene("{A} asked a simple question and waited through {H}'s first answer, then the second. By the third, {H} had stopped trying to sound certain. They could begin from there.", discovered),
];

export const INTERLUDES = [
  scene("{H} slept badly. The next day simple tasks took twice as long, and {A} quietly took over the ones that could not wait. {H} noticed and, with some difficulty, said thank you."),
  scene("{H} caught {H.poss} reflection in a pane of glass and stopped to straighten {H.poss} collar. It was an absurd thing to care about. It was also something {H.subj} could put right."),
  scene("{H} made a list of questions and left room beneath each one. A blank space was less comforting than a guess, but it did not have to be unlearned later.", discovered),
  scene("{A} had a way of humming when {A.subj} {A.was} worried. {H} used to find it distracting. Now the small, unfinished tune was a way of knowing {H.subj} {H.was} not alone."),
  scene("{H} wrote a letter, read it, and put it aside without sending it. The first version had explained too much and admitted too little. A second attempt would have to be shorter."),
  scene("For a while they spoke of ordinary things. {H} learned something about {A}'s work that {H.subj} had never thought to ask. It embarrassed {H.obj} that a friend could be so familiar and still so little known."),
  scene("{H} thought about what {R} had offered. The money would have answered several smaller worries. Naming them made the offer harder to refuse and the reason for refusing it clearer.", pressure),
  scene("It occurred to {H}, not for the first time, that {H.subj} {flaw}. This time {H.subj} tried to name one thing to do differently. A small thing would have to count."),
  scene("{H} thought about {cb}. The memory had become tidier with each retelling. {H.Subj} tried to recall the awkward parts too, especially the things {H.subj} had not understood.", pressure),
  scene("The silence between {H} and {A} was comfortable until one of them tried to explain it. Then they both laughed, and allowed the explanation to remain unfinished."),
  scene("Without {objS}, {H} felt the shape of the loss in every empty pocket. {A} reminded {H.obj} that knowing a thing and owning the evidence were different problems. They still had one another's account.", state => state.discovered && !state.hasObject),
  scene("{H} wrapped {objS} carefully before putting {objThem} away. There was a small comfort in doing that properly, however little protection the wrapping really offered.", holding),
];

const conversation = (lines, when) => ({ lines, when });
export const DIALOGUES = [
  conversation(["“You don't have to do this alone,” {A} said.", "“I know.”", "“Then let me finish a sentence before you decide what I mean.”", "{H} nodded, and tried again."], discovered),
  conversation(["“What will you do when this is over?” {A} asked.", "“Sleep for a week.”", "“And then?”", "{H} had no answer yet. For once {H.subj} left it at that."], pressure),
  conversation(["“Do you trust me?” {H} asked.", "{A} took the question seriously. “Enough to tell you when you're wrong.”", "“That wasn't quite what I meant.”", "“I know.”"]),
  conversation(["“Why did you keep {objThem}?” {A} asked.", "“I thought someone might come looking.”", "“And now?”", "“Now I want to know who.”"], state => state.hasObject && !state.revealed),
  conversation(["“You could have told me,” {A} said.", "“I didn't know how.”", "“You could have started with that.”", "{H} looked down, then began again."], discovered),
  conversation(["“Tell me about {home},” {A} said, “as if I'd never seen it.”", "{H} tried, and found {H.self} describing the smallest things first: familiar turns, a doorway, the sound of coming home."]),
  conversation(["“Do you wish you'd left {objThem} where {objThey} {objWere}?” {A} asked.", "“Sometimes,” {H} said. “That doesn't tell me what to do with {objThem} now.”"], holding),
  conversation(["“Are you frightened?” {A} asked.", "“Yes.”", "“Good. I was beginning to think I was the only one.”", "Neither smiled, but they sat a little closer."], discovered),
  conversation(["“What if we're wrong?” {H} asked.", "“Then we need to find that out too,” {A} said.", "It was less reassuring than a promise, and more useful."], state => state.discovered && !state.metRival),
  conversation(["“Read it to me again,” {A} said.", "{H} read the copy of the statement aloud. This time {A} stopped {H.obj} at each date, and they checked the order together."], state => state.revealed),
];
