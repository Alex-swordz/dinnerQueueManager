//点餐排队Demo
//TaskSettings = [{peopleNum,maxTaskNum}];
//peopleNum表示几人桌,maxTaskNum表示这家店有多少个这样的桌子
const letterStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const moment = require('moment');
//从数组中随机取出元素,N不能大于数组的长度
function getRandomArrayElements(arr, N) {
  let indexArray = [];
  arr = arr || [];
  N = N || 0;
  if (arr.length === 0) {
    return [];
  }
  let max = arr.length - 1;
  let min = 0;
  for (let i = 0; i < N; i++) {
    let randomIndex = parseInt(Math.random() * (max - min + 1)) + min; //取随机数组索引值
    while (indexArray.includes(randomIndex)) {
      randomIndex = parseInt(Math.random() * (max - min + 1)) + min;
    }
    indexArray.push(randomIndex);
  }

  let randomArray = indexArray.map(index => arr[index]);
  return randomArray;
}

class Scheduler {
  constructor(TaskSettings) {
    if ((TaskSettings||[]).length > 0) {
      this.taskMapper = {};
      for (const item of TaskSettings) {
        let { peopleNum, maxExecutingNum } = item;
        if (peopleNum <= 0) {
          continue;
        }
        let taskObj = {
          tasks: [],
          executingTasks: [],
          maxTaskNum: maxExecutingNum,
          idList: []
        };

        let letter = letterStr.substr(peopleNum-1,1);
        for (let i = 1; i <= maxExecutingNum; i++) {
          let idStr = letter + (i.toString().length<2 ? '0'+i : i);
          taskObj.idList.push(idStr);
        }
        this.taskMapper['peopleNum_'+peopleNum] = taskObj;
      }
    } else {
      this.tasks = []; //待执行的任务
      this.executingTasks = []; //正在执行的任务数
      this.maxTaskNum = maxTaskNum;  //最大执行任务数
    }
  }

  getTaskId(idList){
    let taskId = (getRandomArrayElements(idList, 1))[0];
    idList.splice(idList.findIndex(id => id === taskId), 1);

    return taskId;
  }

  generateTask(promiseMaker, peopleNum){
    let taskObj = this.taskMapper['peopleNum_'+peopleNum];
    //从生成的数据中随机拿一个id编号出来
    let taskId = this.getTaskId(taskObj.idList);

    return {
      id: taskId,
      peopleNum: peopleNum,
      promise: promiseMaker
    };
  }

  add(promiseMaker, peopleNum) {
    let task = this.generateTask(promiseMaker, peopleNum);
    let taskObj = this.taskMapper['peopleNum_'+peopleNum];

    if (taskObj.executingTasks.length < taskObj.maxTaskNum) {
      this.run(task, peopleNum);
    } else {
      taskObj.tasks.push(task);
    }

    return task.id;
  }

  run(task, peopleNum) {
    let taskObj = this.taskMapper['peopleNum_'+peopleNum];
    let arrayLength = taskObj.executingTasks.push(task);
    let index = arrayLength - 1;
    task.promise(peopleNum, task.id).then(() => {
      taskObj.executingTasks.splice(index, 1);
      //归还id编号
      taskObj.idList.push(task.id);
      if (taskObj.tasks.length > 0) {
        let newTask = taskObj.tasks.shift();
        newTask.id = this.getTaskId(taskObj.idList);
        this.run(newTask, newTask.peopleNum);
      }
    })
  }

  //获取现在排在前面的桌子数目
  show(peopleNum,deskId){
    let taskObj = this.taskMapper['people_Num'+peopleNum];
    let index = taskObj.tasks.findIndex(item => item.id === deskId);
    let executingTaskNum = taskObj.executingTasks.length;
    console.log(`您的${peopleNum}人桌编号为${deskId},有${executingTaskNum}在吃`);
    console.log(`排在您前面的还有${index}桌`);

    return {
      preTaskNum: index,
      executingTaskNum: executingTaskNum
    };
  }

  //获取任务映射管理数据
  getTaskMapper() {
    return this.taskMapper;
  }
}

//顾客随机用餐的时长:秒
const dinnerTimeArr = [10,20,30,40];
function eatDinnerPromise(peopleNum, deskNum) {
  return new Promise((resolve, reject) => {
    let dinnerTime = (getRandomArrayElements(dinnerTimeArr,1))[0];
    console.log(`我们是${peopleNum}人桌，桌子编号【${deskNum}】,【${moment().format('HH:mm:ss')}】开始用餐，将会进行${dinnerTime}秒。`);
    let ts = dinnerTime*1000;
    setTimeout(()=> {
      console.log(`我们用餐结束【${moment().format('HH:mm:ss')}】，桌子编号【${deskNum}】,用时：${dinnerTime}秒`);
      resolve();
    },ts);
  });
}
//初始化桌子的数目以及能使用的人数
//2人桌：3,4人桌：9, 6人桌：6, 8人桌：4
const deskSettings = [
  { peopleNum: 2, maxExecutingNum: 3 },
  { peopleNum: 4, maxExecutingNum: 9 },
  { peopleNum: 6, maxExecutingNum: 6 },
  { peopleNum: 8, maxExecutingNum: 4 },
];
const scheduler = new Scheduler(deskSettings);
// console.log(scheduler.getTaskMapper());
scheduler.add(eatDinnerPromise,2);
scheduler.add(eatDinnerPromise,2);
scheduler.add(eatDinnerPromise,2);
scheduler.add(eatDinnerPromise,2);
scheduler.add(eatDinnerPromise,2);