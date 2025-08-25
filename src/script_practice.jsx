//consider using .split() method for sorting reference.
//perhaps using arrays as well!
//desctructing is important!
//use json for sending metadata about photos?
//perhaps using JSON.stringify() to transfer data to json format
//for loop - for(my variable, condition, increment by)
//.map() put stuff into a new array, .filter will filter results in an array

export default function Practice() {
/*     const age = 50;
    const name = 'Travisawefawefoiweaflj';
    const percent = 0.6;
    const none = null;
    const any = undefined; */

    const supplies = ['brushes', 'paint', 'palette'];
    supplies.push('gamsol');
    supplies.unshift('pencils')


/*     const arr = [10, 20];
    const [a, b] = arr;  // a=10, b=20
    console.log(arr); */

    const travis = {
        name: 'travis',
        age: 28,
        job: 'manager',
        artStyle: 'anime',
        computer: {
            graphics: 'RTX 2060',
            chip: 'ryzen 5 3600',
            ram: '16gb'
        },
        gender: 'male'

    }



    const myArray2 = [

        {
            id: 1,
            word: 'microphone',
            color: 'pink'

        },
        
        {
            id: 1,
            word: 'lemon',
            color: 'yellow'

        },
        
        {
            id: 1,
            word: 'java',
            color: 'cyan'

        },

    ]

   /* looping over array
    for(let combo of myArray2) {
        console.log(`my word is ${combo.word} and it's respective color is ${combo.color}`)
    } */

   const thingWord = myArray2.map(function(thing) {
       return thing.word;
    });

    console.log(thingWord)


/* 
    const {name, age, job, computer: {graphics}} = travis
    travis.girlfriend = 'Melissa'

    for(let i = 0; i <=50; i++) {
        console.log(`my stuff: ${i}`);
    }
 */
    
    

}
