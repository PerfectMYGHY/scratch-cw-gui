const testLi = [
    1,
    2,
    3,
    4,
    5
];

async function wait(){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve();
        },1000);
    });
}

async function test(){
    for (const item of testLi){
        await wait();
        console.log(item);
    }
    return;

    return Promise.all(testLi
        .map(
            num => wait().then(()=>{
                console.log(num);
            })
        )
    );
}

console.log("开始");
wait()
.then(()=>{
    console.log("等待完毕！");
    test()
    .then(()=>{
        console.log("函数执行完毕");
    });
})
