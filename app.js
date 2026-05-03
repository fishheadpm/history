let data = [];
let currentRound = null;
let queue = [];
let index = 0;
let history = {};

fetch('data.json?v=1')
  .then(res => {
    if (!res.ok) throw new Error('data.jsonを読み込めませんでした');
    return res.json();
  })
  .then(json => {
    data = json;
    init();
  })
  .catch(err => {
    alert('データの読み込みに失敗しました: ' + err.message);
  });

function init() {
  const area = document.getElementById('seriesButtons');
  area.innerHTML = '';

  data.forEach(round => {
    const btn = document.createElement('button');
    btn.textContent = round.name;
    btn.onclick = () => selectRound(round);
    area.appendChild(btn);
  });
}

function selectRound(round) {
  currentRound = round;
  document.getElementById('roundTitle').textContent = round.name;
  loadHistory();
  show('menuScreen');
}

function start() {
  queue = shuffle(currentRound.questions.map(q => q.id));
  index = 0;
  saveProgress();
  next();
}

function continueGame() {
  const saved = JSON.parse(localStorage.getItem(progressKey()) || 'null');
  if (!saved || !Array.isArray(saved.queue)) {
    alert('続きのデータがありません。');
    return;
  }
  queue = saved.queue;
  index = saved.index || 0;
  next();
}

function next() {
  if (index >= queue.length) {
    localStorage.removeItem(progressKey());
    alert('終了です。全問正解しました。');
    backToMenu();
    return;
  }

  const q = getCurrentQuestion();
  if (!q) {
    index++;
    saveProgress();
    next();
    return;
  }

  document.getElementById('progress').textContent = `${index + 1} / ${queue.length}`;
  document.getElementById('question').textContent = q.question;
  document.getElementById('answer').textContent = '';
  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('answerButton').classList.remove('hidden');
  show('quizScreen');
}

function showAnswer() {
  const q = getCurrentQuestion();
  document.getElementById('answer').textContent = q.answer;
  document.getElementById('answerArea').classList.remove('hidden');
  document.getElementById('answerButton').classList.add('hidden');
}

function correct() {
  index++;
  saveProgress();
  next();
}

function wrong() {
  const q = getCurrentQuestion();
  history[q.id] = (history[q.id] || 0) + 1;
  queue.push(q.id);
  index++;
  saveHistory();
  saveProgress();
  next();
}

function showHistory() {
  loadHistory();
  const entries = Object.entries(history);
  if (entries.length === 0) {
    alert('履歴なし');
    return;
  }

  const text = entries.map(([id, count]) => {
    const q = currentRound.questions.find(item => item.id === id);
    if (!q) return `${id}: ${count}回`;
    return `${q.answer}: ${count}回\n${q.question}`;
  }).join('\n\n');

  alert(text);
}

function resetHistory() {
  if (!confirm('この回の進捗と間違えた履歴をリセットしますか？')) return;
  localStorage.removeItem(progressKey());
  localStorage.removeItem(historyKey());
  history = {};
  alert('リセットしました。');
}

function getCurrentQuestion() {
  return currentRound.questions.find(q => q.id === queue[index]);
}

function saveProgress() {
  localStorage.setItem(progressKey(), JSON.stringify({ queue, index }));
}

function loadHistory() {
  history = JSON.parse(localStorage.getItem(historyKey()) || '{}');
}

function saveHistory() {
  localStorage.setItem(historyKey(), JSON.stringify(history));
}

function progressKey() {
  return `history_quiz_progress_${currentRound.id}_self`;
}

function historyKey() {
  return `history_quiz_history_${currentRound.id}`;
}

function shuffle(arr) {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function show(id) {
  ['seriesScreen', 'menuScreen', 'quizScreen'].forEach(screenId => {
    document.getElementById(screenId).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function backToSeries() {
  show('seriesScreen');
}

function backToMenu() {
  show('menuScreen');
}
