const MAX_CLASSES = 20;
const MAX_STUDENTS_PER_CLASS = 100;

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
  singleClassName: document.querySelector('#singleClassName'),
  studentInput: document.querySelector('#studentInput'),
  classImportInput: document.querySelector('#classImportInput'),
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
      difficulty: 100,
      activePage: 'classPage'
    },
    activeClassId: classId,
    classes: [{ id: classId, name: '一年级1班', students: [] }]
  };
}

function normalizeState(parsed) {
  if (!parsed.settings) parsed.settings = {};
  parsed.settings.name = parsed.settings.name || '班级宠物园';
  parsed.settings.theme = parsed.settings.theme || '#6d8bff';
  parsed.settings.difficulty = Math.max(20, Number(parsed.settings.difficulty) || 100);
  parsed.settings.activePage = parsed.settings.activePage || 'classPage';

  if (!Array.isArray(parsed.classes) || !parsed.classes.length) {
    const classId = crypto.randomUUID();
    parsed.classes = [{ id: classId, name: '一年级1班', students: [] }];
    parsed.activeClassId = classId;
  }

  parsed.classes = parsed.classes.slice(0, MAX_CLASSES);

  parsed.classes.forEach((classroom) => {
    if (!Array.isArray(classroom.students)) classroom.students = [];
    delete classroom.rewards;

    classroom.students = classroom.students.slice(0, MAX_STUDENTS_PER_CLASS).map((student) => ({
      id: student.id || crypto.randomUUID(),
      name: student.name || '未命名',
      selected: Boolean(student.selected),
      food: Number(student.food) || 0,
      level: Math.min(10, Math.max(1, Number(student.level) || 1)),
      points: Number(student.points) || Number(student.badges) || 0,
      pet: student.pet || null
    }));
  });

  const hasActiveClass = parsed.classes.some((item) => item.id === parsed.activeClassId);
  if (!hasActiveClass) parsed.activeClassId = parsed.classes[0].id;
}

function saveState() {
  localStorage.setItem('class-pet-park-v1', JSON.stringify(state));
}

function currentClass() {
  return state.classes.find((item) => item.id === state.activeClassId) || state.classes[0];
}

function bindEvents() {
  document.querySelectorAll('.page-btn').forEach((button) => {
    button.addEventListener('click', () => switchPage(button.dataset.page));
  });

  document.querySelector('#addClassBtn').addEventListener('click', () => {
    const name = prompt('请输入新班级名称：', `新班级${state.classes.length + 1}`)?.trim();
    if (name) createClass(name);
  });

  document.querySelector('#addClassByInputBtn').addEventListener('click', () => {
    const name = nodes.singleClassName.value.trim();
    if (!name) return;
    createClass(name);
    nodes.singleClassName.value = '';
  });

  document.querySelector('#importBtn').addEventListener('click', importStudentsToCurrentClass);
  document.querySelector('#importClassesBtn').addEventListener('click', importClassesWithStudents);
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

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === pageId));
  document.querySelectorAll('.page-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.page === pageId));
  state.settings.activePage = pageId;
  saveState();
}

function createClass(name) {
  if (state.classes.length >= MAX_CLASSES) {
    toast(`⚠️ 最多创建 ${MAX_CLASSES} 个班级`);
    return;
  }

  if (state.classes.some((item) => item.name === name)) {
    toast('⚠️ 班级名称已存在');
    return;
  }

  const id = crypto.randomUUID();
  state.classes.push({ id, name, students: [] });
  state.activeClassId = id;
  toast(`🎉 已创建 ${name}`);
  saveState();
  renderAll();
}

function importStudentsToCurrentClass() {
  const classroom = currentClass();
  const names = nodes.studentInput.value.split('\n').map((name) => name.trim()).filter(Boolean);
  if (!names.length) return;

  const existing = new Set(classroom.students.map((student) => student.name));
  let added = 0;
  let skippedLimit = 0;

  for (const name of names) {
    if (existing.has(name)) continue;
    if (classroom.students.length >= MAX_STUDENTS_PER_CLASS) {
      skippedLimit += 1;
      continue;
    }

    classroom.students.push({
      id: crypto.randomUUID(),
      name,
      selected: false,
      food: 0,
      level: 1,
      points: 0,
      pet: null
    });
    added += 1;
    existing.add(name);
  }

  nodes.studentInput.value = '';
  toast(`✅ 导入 ${added} 人${skippedLimit ? `，超限未导入 ${skippedLimit} 人` : ''}`);
  saveState();
  renderAll();
}

function importClassesWithStudents() {
  const lines = nodes.classImportInput.value.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return;

  let classAdded = 0;
  let studentAdded = 0;

  for (const line of lines) {
    const [classNameRaw, studentChunk = ''] = line.split(':');
    const className = classNameRaw?.trim();
    if (!className) continue;

    let classroom = state.classes.find((item) => item.name === className);
    if (!classroom) {
      if (state.classes.length >= MAX_CLASSES) {
        toast(`⚠️ 达到班级上限 ${MAX_CLASSES}，已停止新增班级`);
        break;
      }
      classroom = { id: crypto.randomUUID(), name: className, students: [] };
      state.classes.push(classroom);
      classAdded += 1;
    }

    const names = studentChunk
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    const existing = new Set(classroom.students.map((student) => student.name));

    for (const name of names) {
      if (existing.has(name)) continue;
      if (classroom.students.length >= MAX_STUDENTS_PER_CLASS) break;
      classroom.students.push({
        id: crypto.randomUUID(),
        name,
        selected: false,
        food: 0,
        level: 1,
        points: 0,
        pet: null
      });
      existing.add(name);
      studentAdded += 1;
    }
  }

  nodes.classImportInput.value = '';
  toast(`📦 已导入 ${classAdded} 个班级，${studentAdded} 份学生档案`);
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

  const targets = mode === 'all' ? classroom.students : classroom.students.filter((student) => student.selected);
  if (!targets.length) return toast('⚠️ 请先勾选学生再喂养');

  targets.forEach((student) => {
    student.food += amount;
    const previousLevel = student.level;
    student.level = Math.min(10, Math.floor(student.food / state.settings.difficulty) + 1);

    if (student.level > previousLevel) {
      const gained = student.level - previousLevel;
      student.points += gained;
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
  const classroom = currentClass();
  if (!classroom) return;

  document.documentElement.style.setProperty('--theme', state.settings.theme);
  nodes.systemTitle.textContent = state.settings.name;
  nodes.nameInput.value = state.settings.name;
  nodes.themeInput.value = state.settings.theme;
  nodes.difficultyInput.value = state.settings.difficulty;

  renderClassSelect();
  renderStudents();
  renderStats();
  renderRanking();
  switchPage(state.settings.activePage || 'classPage');
}

function renderClassSelect() {
  nodes.classSelect.innerHTML = state.classes.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  nodes.classSelect.value = state.activeClassId;
}

function renderStudents() {
  const classroom = currentClass();
  nodes.studentList.innerHTML = '';
  nodes.petGrid.innerHTML = '';

  classroom.students.forEach((student) => {
    const card = document.querySelector('#studentCardTemplate').content.firstElementChild.cloneNode(true);
    card.querySelector('.student-name').textContent = student.name;
    card.querySelector('.pet-face').textContent = student.pet?.emoji || '🥚';
    card.querySelector('.pet-name').textContent = `守护神兽：${student.pet?.name || '待分配'}`;
    card.querySelector('.level').textContent = `等级：Lv.${student.level}`;
    card.querySelector('.badges').textContent = `积分：${student.points} 分`;
    card.querySelector('.progress span').style.width = `${Math.min(100, ((student.food % state.settings.difficulty) / state.settings.difficulty) * 100)}%`;

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
  const avgLevel = total ? (classroom.students.reduce((sum, item) => sum + item.level, 0) / total).toFixed(1) : '0.0';
  const totalPoints = classroom.students.reduce((sum, item) => sum + item.points, 0);
  nodes.classStats.textContent = `班级：${classroom.name} ｜ 学生：${total}/${MAX_STUDENTS_PER_CLASS} ｜ 已管理班级：${state.classes.length}/${MAX_CLASSES} ｜ 平均等级：${avgLevel} ｜ 总积分：${totalPoints}`;
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
