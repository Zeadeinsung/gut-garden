export type ModuleCode = 'fiber_square' | 'ferment_workshop' | 'scfa_spring' | 'barrier_wall' | 'eco_station'
export type QuizType = 'single_choice' | 'pairing' | 'ordering'

export interface CardContent {
  id: string
  title: string
  front_image: string
  back_content: string
  child_summary: string
  parent_detail: string
}

export interface QuizContent {
  id: string
  module_code: ModuleCode
  type: QuizType
  question: string
  options: string[]
  answer: number | number[]
  answer_hint: string
}

export interface ModuleDef {
  module_code: ModuleCode
  name: string
  description: string
  cards: CardContent[]
  quizzes: QuizContent[]
}

export const MODULE_ORDER: ModuleCode[] = ['fiber_square', 'ferment_workshop', 'scfa_spring', 'barrier_wall', 'eco_station']

function card(module_code: ModuleCode, n: number, title: string, back_content: string, child_summary: string, parent_detail: string): CardContent {
  return {
    id: `${module_code}_c${n}`,
    title,
    front_image: `/assets/cards/card_${module_code}.png`,
    back_content,
    child_summary,
    parent_detail,
  }
}

function quiz(
  module_code: ModuleCode,
  n: number,
  type: QuizType,
  question: string,
  options: string[],
  answer: number | number[],
  answer_hint: string
): QuizContent {
  return { id: `${module_code}_q${n}`, module_code, type, question, options, answer, answer_hint }
}

export const MODULE_DEFS: Record<ModuleCode, ModuleDef> = {
  fiber_square: {
    module_code: 'fiber_square',
    name: '膳食纤维广场',
    description: '了解膳食纤维如何喂养肠道居民',
    cards: [
      card(
        'fiber_square',
        1,
        '什么是膳食纤维？',
        '膳食纤维是植物里不容易被消化的部分，像一把小扫把，帮肠道做清洁，还能喂养肠道里的好居民。',
        '膳食纤维像小扫把，帮肚子做清洁～',
        '膳食纤维能促进肠道蠕动、增加饱腹感，是维持消化健康的重要成分。'
      ),
      card(
        'fiber_square',
        2,
        '纤维去哪里了？',
        '纤维吃进肚子后，一路到达大肠，在那里被益生菌们「吃掉」发酵，产生对身体有益的物质。',
        '纤维会坐着滑梯到达大肠，被小居民吃掉！',
        '纤维在小肠几乎不被吸收，主要在大肠被肠道菌群发酵利用。'
      ),
      card(
        'fiber_square',
        3,
        '蔬菜里的纤维',
        '西蓝花、胡萝卜、菠菜这些绿油油的蔬菜都藏着丰富的纤维，是肠道居民最爱的口粮之一。',
        '西蓝花和胡萝卜里藏着很多纤维口粮！',
        '深色蔬菜膳食纤维含量高，建议每天摄入 300-500g 蔬菜。'
      ),
      card(
        'fiber_square',
        4,
        '水果里的纤维',
        '苹果、香蕉、蓝莓等水果不仅好吃，果肉和果皮里也有很多纤维，记得连皮带肉吃更有营养。',
        '苹果香蕉都带着纤维小宝藏～',
        '水果富含可溶性纤维，果皮纤维更多，但要注意适量糖分摄入。'
      ),
      card(
        'fiber_square',
        5,
        '全谷物纤维',
        '燕麦、玉米、糙米这些粗粮比精米白面保留更多纤维，做成早餐粥既暖胃又养生。',
        '燕麦玉米是全谷物纤维的冠军！',
        '全谷物比精制谷物保留更多膳食纤维和 B 族维生素，建议替代部分主食。'
      ),
    ],
    quizzes: [
      quiz('fiber_square', 1, 'single_choice', '下面哪种食物含有丰富的膳食纤维？', ['糖果', '西蓝花', '蛋糕', '汽水'], 1, '糖果蛋糕和汽水含糖高、纤维少，蔬菜才是纤维大户。'),
      quiz(
        'fiber_square',
        2,
        'pairing',
        '把食物和它的类别配对起来',
        ['西蓝花', '苹果', '燕麦', '蔬菜', '水果', '谷物'],
        [0, 1, 2],
        '西蓝花是蔬菜，苹果是水果，燕麦是谷物～'
      ),
      quiz(
        'fiber_square',
        3,
        'ordering',
        '膳食纤维的旅程，按正确顺序排列',
        ['到达大肠被居民吃掉', '吃进嘴巴', '一路下滑到肠道'],
        [1, 2, 0],
        '先吃进嘴，再滑到肠道，最后到大肠被益生菌吃掉。'
      ),
    ],
  },

  ferment_workshop: {
    module_code: 'ferment_workshop',
    name: '发酵工坊',
    description: '认识肠道里负责发酵的小工厂',
    cards: [
      card(
        'ferment_workshop',
        1,
        '发酵是什么？',
        '发酵是微生物把食物残渣分解成小分子的过程，就像工坊里的工人把原料加工成产品。',
        '发酵就是小工人们把食物加工成新东西～',
        '肠道菌群发酵不可消化碳水化合物，产生短链脂肪酸、气体等代谢产物。'
      ),
      card(
        'ferment_workshop',
        2,
        '肠道小居民',
        '益生菌是住在肠道里的好居民，它们帮助我们消化食物、保护健康，是发酵工坊的主力工人。',
        '益生菌是工坊里勤劳的好工人！',
        '双歧杆菌、乳酸杆菌等益生菌是肠道发酵的主力军。'
      ),
      card(
        'ferment_workshop',
        3,
        '发酵的产物',
        '发酵工坊会产出短链脂肪酸、维生素，还会产生一点点气体，这都是工坊正常工作的信号。',
        '工坊会产出营养和一点点小气泡～',
        '发酵产物包括短链脂肪酸、B 族维生素和气体，是肠道健康的指标。'
      ),
      card(
        'ferment_workshop',
        4,
        '酸奶里的益生菌',
        '酸奶、泡菜这些发酵食物里藏着活的益生菌，吃进肚子后能壮大工坊的工人队伍。',
        '酸奶里有活的益生菌小工人！',
        '发酵乳制品和发酵蔬菜含有活性益生菌，有助于维持肠道菌群。'
      ),
      card(
        'ferment_workshop',
        5,
        '帮助发酵的食物',
        '多吃膳食纤维，工坊的工人就有充足的原料，发酵得更起劲，产出更多好营养。',
        '多吃纤维，工坊工人干活更有劲！',
        '益生元（可发酵纤维）是益生菌的食物，能促进有益菌增殖。'
      ),
    ],
    quizzes: [
      quiz('ferment_workshop', 1, 'single_choice', '肠道里负责发酵工作的小居民是谁？', ['病毒', '益生菌', '蚊虫', '小鱼'], 1, '益生菌就是工坊里勤劳的发酵工人。'),
      quiz('ferment_workshop', 2, 'pairing', '把发酵食物和它的类别配对', ['酸奶', '泡菜', '汽水', '发酵乳', '发酵蔬菜', '高糖饮料'], [0, 1, 2], '酸奶是发酵乳，泡菜是发酵蔬菜，汽水不是发酵食物。'),
      quiz('ferment_workshop', 3, 'ordering', '发酵工坊的工作流程，按顺序排列', ['产出短链脂肪酸', '居民吃掉纤维原料', '原料到达大肠'], [2, 1, 0], '原料先到大肠，被居民吃掉，再产出短链脂肪酸。'),
    ],
  },

  scfa_spring: {
    module_code: 'scfa_spring',
    name: '短链脂肪酸泉',
    description: '探索肠道居民产出的能量泉水',
    cards: [
      card(
        'scfa_spring',
        1,
        '短链脂肪酸是什么？',
        '短链脂肪酸是肠道益生菌发酵纤维后产出的「能量泉水」，能给肠道和身体提供能量。',
        '短链脂肪酸是益生菌产出的能量泉水！',
        '乙酸、丙酸、丁酸是主要的短链脂肪酸，具有供能和免疫调节作用。'
      ),
      card(
        'scfa_spring',
        2,
        '能量泉水从哪来？',
        '泉水不是凭空出现的，需要益生菌吃到足够的膳食纤维才能生产出来。',
        '泉水需要纤维原料才能生产出来～',
        '可发酵纤维是合成短链脂肪酸的原料，膳食纤维摄入不足则产量下降。'
      ),
      card(
        'scfa_spring',
        3,
        '滋养肠道屏障',
        '丁酸是城墙砖块最喜欢的能量，喝了泉水，肠道屏障的城墙就更结实。',
        '泉水能让肠道城墙更结实！',
        '丁酸是结肠上皮细胞的主要能量来源，能维护肠道屏障完整。'
      ),
      card(
        'scfa_spring',
        4,
        '哪些食物产泉多',
        '抗性淀粉（放凉的土豆）、菊粉（洋葱大蒜）、燕麦这些食物，都是产泉大户。',
        '燕麦土豆是产泉水的大户～',
        '抗性淀粉和菊粉等益生元能高效促进短链脂肪酸生成。'
      ),
      card(
        'scfa_spring',
        5,
        '如何让泉水更充沛',
        '规律三餐、多吃纤维、早睡早起，肠道居民状态好，产出的泉水就越多。',
        '吃好睡好，泉水就哗哗流～',
        '规律作息和均衡膳食能稳定肠道微生态，维持短链脂肪酸水平。'
      ),
    ],
    quizzes: [
      quiz('scfa_spring', 1, 'single_choice', '短链脂肪酸主要由谁产生？', ['胃', '肠道益生菌', '肝脏', '心脏'], 1, '肠道益生菌发酵纤维，才会产出短链脂肪酸。'),
      quiz('scfa_spring', 2, 'single_choice', '哪种食物能促进短链脂肪酸生成？', ['奶茶', '薯片', '燕麦', '汽水'], 2, '燕麦富含可发酵纤维，是产泉大户。'),
      quiz('scfa_spring', 3, 'ordering', '泉水诞生的过程，按顺序排列', ['产出能量泉水', '益生菌吃到纤维', '喝下燕麦粥'], [2, 1, 0], '先吃进纤维，益生菌发酵，再产出短链脂肪酸。'),
    ],
  },

  barrier_wall: {
    module_code: 'barrier_wall',
    name: '肠道屏障城墙',
    description: '了解肠道屏障如何保护身体',
    cards: [
      card(
        'barrier_wall',
        1,
        '肠道屏障是什么？',
        '肠道屏障就像一座城墙，把营养物质放进来，把坏东西挡在外面，保护我们的身体。',
        '肠道屏障是保护身体的城墙！',
        '肠道屏障由机械屏障、化学屏障和免疫屏障组成，阻止有害物质进入循环系统。'
      ),
      card(
        'barrier_wall',
        2,
        '城墙的砖块',
        '肠道细胞像一块块砖紧紧挨着，砖块之间缝隙越小，城墙越牢固。',
        '肠道细胞是城墙的小砖块，挨得紧紧的！',
        '肠上皮细胞间的紧密连接是机械屏障的关键，控制物质通透性。'
      ),
      card(
        'barrier_wall',
        3,
        '粘液护城河',
        '城墙前还有一条粘液护城河，坏菌游不过来，好菌在护城河里安家。',
        '粘液护城河挡住坏菌去路～',
        '肠道粘液层含有抗菌肽和分泌型 IgA，是重要的化学屏障。'
      ),
      card(
        'barrier_wall',
        4,
        '城墙破了会怎样',
        '城墙出现裂缝，坏东西钻进来，肚子就会不舒服，还可能容易过敏感冒。',
        '城墙裂缝会让坏东西钻进来！',
        '肠道屏障受损（肠漏）与食物不耐受、过敏和慢性炎症相关。'
      ),
      card(
        'barrier_wall',
        5,
        '加固城墙的方法',
        '多吃膳食纤维和益生菌，补充能量泉水，规律作息，城墙就会又高又结实。',
        '纤维+益生菌+好睡眠，城墙更结实！',
        '膳食纤维、益生菌、充足的丁酸和良好作息共同维护肠道屏障。'
      ),
    ],
    quizzes: [
      quiz('barrier_wall', 1, 'single_choice', '肠道屏障的主要作用是什么？', ['消化食物', '挡住坏东西保护身体', '制造血液', '储存大便'], 1, '肠道屏障把坏东西挡在外面，保护身体。'),
      quiz('barrier_wall', 2, 'pairing', '把城墙的部件和它的作用配对', ['肠道细胞', '粘液', '益生菌', '紧密砖块', '护城河', '守卫居民'], [0, 1, 2], '肠道细胞是砖块，粘液是护城河，益生菌是守卫。'),
      quiz('barrier_wall', 3, 'ordering', '加固城墙，按正确顺序做', ['补充益生菌', '多喝能量泉水', '多吃膳食纤维'], [2, 0, 1], '先多吃纤维喂养居民，再补益生菌，喝足泉水让城墙更结实。'),
    ],
  },

  eco_station: {
    module_code: 'eco_station',
    name: '生态平衡观测站',
    description: '观测肠道菌群的生态平衡',
    cards: [
      card(
        'eco_station',
        1,
        '菌群生态',
        '肠道里住着数以万亿计的微生物，好菌和坏菌相互制衡，保持平衡身体才健康。',
        '肠道里有万亿个微生物小伙伴～',
        '肠道菌群由细菌、真菌等构成，好菌与坏菌的平衡影响整体健康。'
      ),
      card(
        'eco_station',
        2,
        '多样性很重要',
        '菌群的种类越丰富，生态越稳定，就像森林里植物多才不容易生病。',
        '菌群种类越多样，身体越强壮！',
        '菌群多样性是肠道健康的标志，多样性降低与多种疾病相关。'
      ),
      card(
        'eco_station',
        3,
        '破坏平衡的因素',
        '经常吃高糖食物、乱用抗生素、熬夜，都会让好菌减少、坏菌变多。',
        '高糖、乱吃药、熬夜会赶走好菌！',
        '高糖饮食、抗生素滥用和不规律作息会破坏肠道菌群平衡。'
      ),
      card(
        'eco_station',
        4,
        '维持平衡',
        '均衡饮食、规律作息、适量运动，就像给生态园浇水施肥，菌群更健康。',
        '均衡饮食是给菌群生态园浇水！',
        '饮食、作息和运动是塑造健康肠道菌群的核心生活方式因素。'
      ),
      card(
        'eco_station',
        5,
        '观测指标',
        '便便的形状、颜色，还有情绪和精力，都是观测菌群生态的小信号。',
        '便便和情绪都是生态观测的信号灯～',
        '便便形态（Bristol 分型）、消化感受和整体精力可反映菌群状态。'
      ),
    ],
    quizzes: [
      quiz('eco_station', 1, 'single_choice', '以下哪个做法最有利于肠道菌群平衡？', ['天天吃炸鸡', '均衡饮食多运动', '乱吃抗生素', '经常熬夜'], 1, '均衡饮食加规律运动能维持菌群生态平衡。'),
      quiz('eco_station', 2, 'pairing', '把行为和它对菌群的影响配对', ['高糖饮食', '规律作息', '多吃纤维', '赶走好菌', '稳定菌群', '喂养好菌'], [0, 1, 2], '高糖赶走好菌，规律作息稳定菌群，纤维喂养好菌。'),
      quiz('eco_station', 3, 'ordering', '发现菌群失衡后，按正确步骤调整', ['多吃膳食纤维', '观察便便信号', '恢复规律作息'], [1, 0, 2], '先观察信号，再吃纤维喂养好菌，最后作息跟上。'),
    ],
  },
}

export function findQuiz(questionId: string): QuizContent | null {
  for (const code of MODULE_ORDER) {
    const q = MODULE_DEFS[code].quizzes.find((x) => x.id === questionId)
    if (q) return q
  }
  return null
}
