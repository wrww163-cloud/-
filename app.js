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

const DEFAULT_REWARDS = [
  { id: crypto.randomUUID(), name: '免写作业卡', cost: 4, stock: 8 },
  { id: crypto.randomUUID(), name: '前排选座券', cost: 3, stock: 10 },
  { id: crypto.randomUUID(), name: '小零食券', cost: 2, stock: 15 }
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
  shopList: document.querySelector('#shopList'),
  rewardName: document.querySelector('#rewardName'),
  rewardCost: document.querySelector('#rewardCost'),
  rewardStock: document.querySelector('#rewardStock'),
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
    return JSON.parse(raw);
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
        students: [],
        rewards: structuredClone(DEFAULT_REWARDS)
      }
    ]
  };
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
  document.querySelector('#addRewardBtn').addEventListener('click', addReward);
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
  state.classes.push({
    id,
    name,
    students: [],
    rewards: structuredClone(DEFAULT_REWARDS)
  });
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
  for (const name of list) {
    if (existing.has(name)) continue;
    classroom.students.push({
      id: crypto.randomUUID(),
      name,
      selected: false,
      food: 0,
      level: 1,
      badges: 0,
      pet: null
    });
  }
  nodes.studentInput.value = '';
  toast(`✅ 已导入 ${list.length} 位学生`);
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
      student.badges += gained;
      toast(`🎊 ${student.name} 的 ${student.pet?.name || '神兽'} 升到 Lv.${student.level}，获得 ${gained} 枚勋章！`);
    }
  });

  toast(`🍗 因“${reason}”喂养了 ${targets.length} 位同学`);
  saveState();
  renderAll();
}

function addReward() {
  const name = nodes.rewardName.value.trim();
  const cost = Number(nodes.rewardCost.value);
  const stock = Number(nodes.rewardStock.value);
  if (!name || cost < 1 || stock < 1) return;

  currentClass().rewards.push({ id: crypto.randomUUID(), name, cost, stock });
  nodes.rewardName.value = '';
  nodes.rewardCost.value = '';
  nodes.rewardStock.value = '';
  toast(`🛒 已上架奖品：${name}`);
  saveState();
  renderAll();
}

function redeem(rewardId, studentId) {
  const classroom = currentClass();
  const reward = classroom.rewards.find((item) => item.id === rewardId);
  const student = classroom.students.find((item) => item.id === studentId);
  if (!reward || !student) return;
  if (reward.stock <= 0) return toast('⛔ 库存不足');
  if (student.badges < reward.cost) return toast(`😿 ${student.name} 徽章不足`);

  reward.stock -= 1;
  student.badges -= reward.cost;
  toast(`🎁 ${student.name} 兑换了「${reward.name}」`);
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
  renderShop();
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
    card.querySelector('.badges').textContent = `徽章：${student.badges} 枚`;
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
  const totalBadges = classroom.students.reduce((sum, item) => sum + item.badges, 0);
  nodes.classStats.textContent = `学生数：${total} ｜ 平均等级：${avgLevel} ｜ 班级总徽章：${totalBadges}`;
}

function renderShop() {
  const classroom = currentClass();
  nodes.shopList.innerHTML = '';

  classroom.rewards.forEach((reward) => {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const buyers = classroom.students
      .map(
        (student) =>
          `<button ${student.badges < reward.cost || reward.stock <= 0 ? 'disabled' : ''} data-reward="${reward.id}" data-student="${student.id}">${student.name}兑换</button>`
      )
      .join('');

    row.innerHTML = `
      <div>
        <strong>${reward.name}</strong>
        <div class="pet-name">需要 ${reward.cost} 枚徽章 ｜ 库存 ${reward.stock}</div>
      </div>
      <div class="row">${buyers}</div>
    `;
    row.querySelectorAll('button[data-reward]').forEach((btn) => {
      btn.addEventListener('click', () => redeem(btn.dataset.reward, btn.dataset.student));
    });
    nodes.shopList.append(row);
  });
}

function toast(message) {
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  nodes.barrage.prepend(item);
  setTimeout(() => item.remove(), 3200);
}
