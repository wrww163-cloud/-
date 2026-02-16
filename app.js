const PETS = [
  { name: '柯基', emoji: '🐶' },
  { name: '布偶猫', emoji: '🐱' },
  { name: '拉布拉多', emoji: '🦮' },
  { name: '雪狐', emoji: '🦊' },
  { name: '小熊猫', emoji: '🦝' },
  { name: '云朵兔', emoji: '🐰' },
  { name: '星光鹿', emoji: '🦌' },
  { name: '海盐企鹅', emoji: '🐧' },
  { name: '彩虹马', emoji: '🦄' },
  { name: '闪电龙', emoji: '🐉' },
  { name: '奶糖仓鼠', emoji: '🐹' },
  { name: '月光猫头鹰', emoji: '🦉' },
  { name: '泡泡海豚', emoji: '🐬' },
  { name: '向日葵狮', emoji: '🦁' },
  { name: '樱桃熊', emoji: '🐻' },
  { name: '极光狼', emoji: '🐺' },
  { name: '铃兰小鹿', emoji: '🫎' },
  { name: '青柠青蛙', emoji: '🐸' },
  { name: '莓果刺猬', emoji: '🦔' },
  { name: '云团绵羊', emoji: '🐑' },
  { name: '糖果考拉', emoji: '🐨' }
];

const state = loadState();
const nodes = {
  systemTitle: document.querySelector('#systemTitle'),
  classSelect: document.querySelector('#classSelect'),
  studentInput: document.querySelector('#studentInput'),
  studentList: document.querySelector('#studentList'),
  petGrid: document.querySelector('#petGrid'),
  classStats: document.querySelector('#classStats'),
  foodAmount: document.querySelector('#foodAmount'),
  reasonSelect: document.querySelector('#reasonSelect'),
  rankingList: document.querySelector('#rankingList'),
  barrage: document.querySelector('#barrage'),
  nameInput: document.querySelector('#nameInput'),
  themeInput: document.querySelector('#themeInput'),
  difficultyInput: document.querySelector('#difficultyInput')
};

bindEvents();
renderAll();

function loadState() {
  const raw = localStorage.getItem('class-pet-park-v1');
  if (raw) {
    const parsed = JSON.parse(raw);
    normalizeState(parsed);
    return parsed;
  }

  const classId = crypto.randomUUID();
  return {
    settings: {
      name: '班级宠物园',
      theme: '#6d8bff',
      difficulty: 100
    },
    activeClassId: classId,
    classes: [
      {
        id: classId,
        name: '一年级1班',
        students: []
      }
    ]
  };
}

function normalizeState(parsed) {
  if (!Array.isArray(parsed.classes) || !parsed.classes.length) {
    const classId = crypto.randomUUID();
    parsed.classes = [{ id: classId, name: '一年级1班', students: [] }];
    parsed.activeClassId = classId;
  }

  parsed.classes.forEach((classroom) => {
    if (!Array.isArray(classroom.students)) classroom.students = [];
    delete classroom.rewards;
    classroom.students.forEach((student) => {
      if (typeof student.points !== 'number') {
        student.points = Number(student.badges) || 0;
      }
      if (typeof student.badges !== 'number') {
        student.badges = student.points;
      }
      if (typeof student.food !== 'number') student.food = 0;
      if (typeof student.level !== 'number') student.level = 1;
      if (typeof student.selected !== 'boolean') student.selected = false;
      if (!student.pet) student.pet = null;
    });
  });

  if (!parsed.settings) {
    parsed.settings = { name: '班级宠物园', theme: '#6d8bff', difficulty: 100 };
  }
  if (!parsed.settings.name) parsed.settings.name = '班级宠物园';
  if (!parsed.settings.theme) parsed.settings.theme = '#6d8bff';
  parsed.settings.difficulty = Math.max(20, Number(parsed.settings.difficulty) || 100);

  const hasActiveClass = parsed.classes.some((item) => item.id === parsed.activeClassId);
  if (!hasActiveClass) parsed.activeClassId = parsed.classes[0].id;
}

function saveState() {
  localStorage.setItem('class-pet-park-v1', JSON.stringify(state));
}

function currentClass() {
  return state.classes.find((item) => item.id === state.activeClassId);
}

function bindEvents() {
  document.querySelector('#addClassBtn').addEventListener('click', addClass);
  document.querySelector('#importBtn').addEventListener('click', importStudents);
  document.querySelector('#randomAssignBtn').addEventListener('click', randomAssignPets);
  document.querySelector('#selfAssignBtn').addEventListener('click', selfAssignPets);
  document.querySelector('#feedSelectedBtn').addEventListener('click', () => feedStudents('selected'));
  document.querySelector('#feedAllBtn').addEventListener('click', () => feedStudents('all'));
  document.querySelector('#saveSettingsBtn').addEventListener('click', saveSettings);
  nodes.classSelect.addEventListener('change', (event) => {
    state.activeClassId = event.target.value;
    saveState();
    renderAll();
  });
}

function addClass() {
  const name = prompt('请输入新班级名称：', `新班级${state.classes.length + 1}`)?.trim();
  if (!name) return;

  const id = crypto.randomUUID();
  state.classes.push({ id, name, students: [] });
  state.activeClassId = id;
  toast(`🎉 已创建 ${name}`);
  saveState();
  renderAll();
}

function importStudents() {
  const list = nodes.studentInput.value
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean);
  if (!list.length) return;

  const classroom = currentClass();
  const existing = new Set(classroom.students.map((student) => student.name));
  let addedCount = 0;

  for (const name of list) {
    if (existing.has(name)) continue;
    classroom.students.push({
      id: crypto.randomUUID(),
      name,
      selected: false,
      food: 0,
      level: 1,
      points: 0,
      badges: 0,
      pet: null
    });
    addedCount += 1;
  }

  nodes.studentInput.value = '';
  toast(`✅ 已导入 ${addedCount} 位学生`);
  saveState();
  renderAll();
}

function randomAssignPets() {
  const classroom = currentClass();
  if (!classroom.students.length) return;

  classroom.students.forEach((student) => {
    student.pet = PETS[Math.floor(Math.random() * PETS.length)];
  });

  toast('🪄 神兽分配完成！');
  saveState();
  renderAll();
}

function selfAssignPets() {
  const classroom = currentClass();
  classroom.students.forEach((student) => {
    const options = PETS.map((pet, index) => `${index + 1}. ${pet.emoji} ${pet.name}`).join('\n');
    const picked = prompt(`给 ${student.name} 选择神兽（输入编号）:\n${options}`, '1');
    const selectedPet = PETS[Number(picked) - 1];
    if (selectedPet) student.pet = selectedPet;
  });

  toast('🎯 自选神兽已完成');
  saveState();
  renderAll();
}

function feedStudents(mode) {
  const classroom = currentClass();
  const amount = Number(nodes.foodAmount.value);
  const reason = nodes.reasonSelect.value;
  if (!amount || amount < 1) return;

  const targets =
    mode === 'all'
      ? classroom.students
      : classroom.students.filter((student) => student.selected);

  if (!targets.length) {
    toast('⚠️ 请先勾选学生再喂养');
    return;
  }

  targets.forEach((student) => {
    student.food += amount;
    const previousLevel = student.level;
    student.level = Math.min(10, Math.floor(student.food / state.settings.difficulty) + 1);

    if (student.level > previousLevel) {
      const gained = student.level - previousLevel;
      student.points += gained;
      student.badges = student.points;
      toast(`🎊 ${student.name} 的 ${student.pet?.name || '神兽'} 升到 Lv.${student.level}，积分 +${gained}`);
    }
  });

  toast(`🍗 因“${reason}”喂养了 ${targets.length} 位同学`);
  saveState();
  renderAll();
}

function saveSettings() {
  state.settings.name = nodes.nameInput.value.trim() || '班级宠物园';
  state.settings.theme = nodes.themeInput.value;
  state.settings.difficulty = Math.max(20, Number(nodes.difficultyInput.value) || 100);
  toast('⚙️ 设置已保存');
  saveState();
  renderAll();
}

function renderAll() {
  document.documentElement.style.setProperty('--theme', state.settings.theme);
  nodes.systemTitle.textContent = state.settings.name;
  nodes.nameInput.value = state.settings.name;
  nodes.themeInput.value = state.settings.theme;
  nodes.difficultyInput.value = state.settings.difficulty;

  renderClassSelect();
  renderStudents();
  renderStats();
  renderRanking();
}

function renderClassSelect() {
  nodes.classSelect.innerHTML = state.classes
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join('');
  nodes.classSelect.value = state.activeClassId;
}

function renderStudents() {
  const classroom = currentClass();
  nodes.studentList.innerHTML = '';
  nodes.petGrid.innerHTML = '';

  classroom.students.forEach((student) => {
    const template = document.querySelector('#studentCardTemplate');
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('.student-name').textContent = student.name;
    card.querySelector('.pet-face').textContent = student.pet?.emoji || '🥚';
    card.querySelector('.pet-name').textContent = `守护神兽：${student.pet?.name || '待分配'}`;
    card.querySelector('.level').textContent = `等级：Lv.${student.level}`;
    card.querySelector('.badges').textContent = `积分：${student.points} 分`;
    card.querySelector('.progress span').style.width = `${Math.min(
      100,
      ((student.food % state.settings.difficulty) / state.settings.difficulty) * 100
    )}%`;

    const checkbox = card.querySelector('.student-check');
    checkbox.checked = student.selected;
    checkbox.addEventListener('change', (event) => {
      student.selected = event.target.checked;
      saveState();
    });

    nodes.studentList.append(card);

    const mirror = card.cloneNode(true);
    mirror.querySelector('.check-wrap')?.remove();
    nodes.petGrid.append(mirror);
  });
}

function renderStats() {
  const classroom = currentClass();
  const total = classroom.students.length;
  const avgLevel = total
    ? (classroom.students.reduce((sum, item) => sum + item.level, 0) / total).toFixed(1)
    : '0.0';
  const totalPoints = classroom.students.reduce((sum, item) => sum + item.points, 0);
  nodes.classStats.textContent = `班级：${classroom.name} ｜ 学生数：${total} ｜ 平均等级：${avgLevel} ｜ 班级总积分：${totalPoints}`;
}

function renderRanking() {
  const classroom = currentClass();
  nodes.rankingList.innerHTML = '';

  if (!classroom.students.length) {
    nodes.rankingList.innerHTML = '<div class="pet-name">当前班级还没有学生，请先导入名单。</div>';
    return;
  }

  const ranking = [...classroom.students].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.level !== a.level) return b.level - a.level;
    if (b.food !== a.food) return b.food - a.food;
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  ranking.forEach((student, index) => {
    const item = document.createElement('article');
    item.className = 'ranking-item';
    item.innerHTML = `
      <div class="rank-num ${index < 3 ? 'top3' : ''}">#${index + 1}</div>
      <div class="rank-main">
        <span class="pet-face">${student.pet?.emoji || '🥚'}</span>
        <div>
          <h3>${student.name}</h3>
          <p class="pet-name">${student.pet?.name || '待分配'} ｜ Lv.${student.level}</p>
        </div>
      </div>
      <div class="rank-points">${student.points} 分</div>
    `;
    nodes.rankingList.append(item);
  });
}

function toast(message) {
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  nodes.barrage.prepend(item);
  setTimeout(() => item.remove(), 3200);
}
