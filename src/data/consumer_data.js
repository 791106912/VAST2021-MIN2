import { chain } from "lodash"

export const timeArr = [
    1388937600
    , 1389024000
    , 1389110400
    , 1389196800
    , 1389283200
    , 1389369600
    , 1389456000
    , 1389542400
    , 1389628800
    , 1389715200
    , 1389801600
    , 1389888000
    , 1389974400
    , 1390060800
]

export const dayStr = [
    '01/06/2014',
    '01/07/2014',
    '01/08/2014',
    '01/09/2014',
    '01/10/2014',
    '01/11/2014',
    '01/12/2014',
    '01/13/2014',
    '01/14/2014',
    '01/15/2014',
    '01/16/2014',
    '01/17/2014',
    '01/18/2014',
    '01/19/2014',
]

export const storeClassify1 = [
    {
        type: 'restaurant',
        data: [
            "Brew've Been Served",
            'Hallowed Grounds',
            'Coffee Cameleon',
            'Coffee Shack',
            'Bean There Done That',
            "Jack's Magical Beans",
            'Brewed Awakenings',
            'Katerinas Caf',
            'Gelatogalore',
            'Ouzeri Elian',
            'Kalami Kafenion',
            'Hippokampos',
            'Abila Zacharo',
            "Guy's Gyros",
        ],
    },
    {
        type: 'parnter',
        data: [
            'Abila Airport',
            'Nationwide Refinery',
            'Maximum Iron and Steel',
            'Carlyle Chemical Inc.',
            'Abila Scrapyard',
            "Octavio's Office Supplies",
            'Chostus Hotel',
            "Frank's Fuel",
            'Kronos Pipe and Irrigation',
            'Stewart and Sons Fabrication',
        ],
    },
    {
        type: 'shop',
        data: [
            "Albert's Fine Clothing",
            'Kronos Mart',
            'Daily Dealz',
            "Shoppers' Delight",
            'Ahaggo Museum',
        ],
    },
    {
        type: 'entertainment',
        data: [
            "Desafio Golf Course",
            'Roberts and Sons',
        ],
    },
    {
        type: 'other',
        data: [
            'U-Pump',
            'General Grocer',
            "Frydos Autosupply n' More",
        ]
    }
]

export const storeClassify = [
    {
        type: 'FastFood',
        data: [
            "Brew've Been Served",
            'Hallowed Grounds',
            'Coffee Cameleon',
            'Coffee Shack',
            'Bean There Done That',
            "Jack's Magical Beans",
            'Brewed Awakenings',
        ],
    },
    {
        type: 'Restaurant',
        data: [
            'Katerinas Caf',
            'Gelatogalore',
            'Ouzeri Elian',
            'Kalami Kafenion',
            'Hippokampos',
            'Abila Zacharo',
            "Guy's Gyros",
        ],
    },
    {
        type: 'Industry',
        data: [
            'Abila Airport',
            'Nationwide Refinery',
            'Maximum Iron and Steel',
            'Carlyle Chemical Inc.',
            'Abila Scrapyard',
            "Octavio's Office Supplies",
            'Chostus Hotel',
            'Kronos Pipe and Irrigation',
            'Stewart and Sons Fabrication',
        ],
    },
    {
        type: 'Gas Station',
        data: [
            "Frank's Fuel",
            'U-Pump',
        ],
    },
    {
        type: 'Living',
        data: [
            "Albert's Fine Clothing",
            'Kronos Mart',
            'Daily Dealz',
            "Shoppers' Delight",
            "Frydos Autosupply n' More",
            'General Grocer',
        ],
    },
    {
        type: 'Entertainment',
        data: [
            "Desafio Golf Course",
            'Roberts and Sons',
            'Ahaggo Museum',
        ],
    },
]

export const storeMapType = chain(storeClassify)
    .map('data')
    .flatten()
    .reduce((obj, d) => {
        obj[d] = storeClassify.find(d1 => d1.data.includes(d)).type
        return obj
    }, {})
    .value()

export const timeClassifyData = [
    {
        data: [-2, 6],
        name: 'Sleeping',
    },
    {
        data: [6, 9],
        name: 'On the way to work',
    },
    {
        data: [9, 12],
        name: 'Working',
    },
    {
        data: [12, 14],
        name: 'Lunch Break',
    },
    {
        data: [14, 18],
        name: 'Working',
    },
    {
        data: [18, 22],
        name: 'After work',
    }
]

// 54个Loy, 55 个 cc
export const ccLoyMap = {
    "L8328": "8129", // true
    "L6417": "7117", // true
    "L1107": "2681", // true
    "L4034": "5407", // true
    "L6110": "8411", // true
    "L2343": "8202", // true
    "L9018": "2418", // true
    "L5777": "9551", // true
    "L7783": "1415", // true
    "L3191": "9635", // true
    "L4164": "7688", // true
    "L1682": "7253", // true
    "L1485": "3853", // true
    "L5947": "2540", // true
    "L3014": "1877", // true
    "L4149": "1321", // true
    "L6544": "7108",// true
    "L4424": "1874", // true
    "L5259": "7819", // true
    "L3800": "7384", // true
    "L5553": "9617", // true
    "L3366": "6895", // true
    "L8148": "6816",// true
    "L4063": "9220", // true
    "L2490": "3484", // true
    "L2769": "8642", // true
    "L2169": "4434", // true
    "L9633": "9735", // true
    "L9637": "2142", // true
    "L8012": "1310", // true
    "L7814": "3492", // true
    "L3259": "9405", // true
    "L9363": "6901", // true
    "L5224": "8156", // true
    "L7291": "9683", // true
    "L9254": "7354", // true
    "L6886": "2463", // true
    "L7761": "3506", // true
    "L5756": "7792", // true
    "L8477": "4530", // true
    "L3317": "2276", // true
    "L5485": "9152", // true
    "L5924": "9614", // true
    "L2459": "5010", // true
    "L2247": "5368", //true
    "L9406": "4948", // true
    "L9362": "3547", // true L9362 和 L3295 是一个人的
    "L3295": "5921", // true
    "L6267": ["6691", "6899"], // true L6227在不同的时间段分属于不同的人，这其实不是一个人的,可能存在盗刷
    "L6119": "7889", // true
    "L2070": "8332", // true
    "L8566": "4795", // true
    "L3572": "1286", // true // L3572 和 L3288有关系
    "L3288": "9241", // true
}

export const carAssign = [
    {
        "LastName": "Calixto",
        "FirstName": "Nils",
        "CarID": "1",
        "CurrentEmploymentType": "Information Technology",
        "CurrentEmploymentTitle": "IT Helpdesk"
    },
    {
        "LastName": "Azada",
        "FirstName": "Lars",
        "CarID": "2",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Engineer"
    },
    {
        "LastName": "Balas",
        "FirstName": "Felix",
        "CarID": "3",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Engineer"
    },
    {
        "LastName": "Barranco",
        "FirstName": "Ingrid",
        "CarID": "4",
        "CurrentEmploymentType": "Executive",
        "CurrentEmploymentTitle": "SVP/CFO"
    },
    {
        "LastName": "Baza",
        "FirstName": "Isak",
        "CarID": "5",
        "CurrentEmploymentType": "Information Technology",
        "CurrentEmploymentTitle": "IT Technician"
    },
    {
        "LastName": "Bergen",
        "FirstName": "Linnea",
        "CarID": "6",
        "CurrentEmploymentType": "Information Technology",
        "CurrentEmploymentTitle": "IT Group Manager"
    },
    {
        "LastName": "Orilla",
        "FirstName": "Elsa",
        "CarID": "7",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Technician"
    },
    {
        "LastName": "Alcazar",
        "FirstName": "Lucas",
        "CarID": "8",
        "CurrentEmploymentType": "Information Technology",
        "CurrentEmploymentTitle": "IT Technician"
    },
    {
        "LastName": "Cazar",
        "FirstName": "Gustav",
        "CarID": "9",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Technician"
    },
    {
        "LastName": "Campo-Corrente",
        "FirstName": "Ada",
        "CarID": "10",
        "CurrentEmploymentType": "Executive",
        "CurrentEmploymentTitle": "SVP/CIO"
    },
    {
        "LastName": "Calzas",
        "FirstName": "Axel",
        "CarID": "11",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Hydraulic Technician"
    },
    {
        "LastName": "Cocinaro",
        "FirstName": "Hideki",
        "CarID": "12",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Site Control"
    },
    {
        "LastName": "Ferro",
        "FirstName": "Inga",
        "CarID": "13",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Site Control"
    },
    {
        "LastName": "Dedos",
        "FirstName": "Lidelse",
        "CarID": "14",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Engineering Group Manager"
    },
    {
        "LastName": "Bodrogi",
        "FirstName": "Loreto",
        "CarID": "15",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Site Control"
    },
    {
        "LastName": "Vann",
        "FirstName": "Isia",
        "CarID": "16",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Perimeter Control"
    },
    {
        "LastName": "Flecha",
        "FirstName": "Sven",
        "CarID": "17",
        "CurrentEmploymentType": "Information Technology",
        "CurrentEmploymentTitle": "IT Technician"
    },
    {
        "LastName": "Frente",
        "FirstName": "Birgitta",
        "CarID": "18",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Geologist"
    },
    {
        "LastName": "Frente",
        "FirstName": "Vira",
        "CarID": "19",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Hydraulic Technician"
    },
    {
        "LastName": "Fusil",
        "FirstName": "Stenig",
        "CarID": "20",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Building Control"
    },
    {
        "LastName": "Osvaldo",
        "FirstName": "Hennie",
        "CarID": "21",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Perimeter Control"
    },
    {
        "LastName": "Nubarron",
        "FirstName": "Adra",
        "CarID": "22",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Badging Office"
    },
    {
        "LastName": "Lagos",
        "FirstName": "Varja",
        "CarID": "23",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Badging Office"
    },
    {
        "LastName": "Mies",
        "FirstName": "Minke",
        "CarID": "24",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Perimeter Control"
    },
    {
        "LastName": "Herrero",
        "FirstName": "Kanon",
        "CarID": "25",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Geologist"
    },
    {
        "LastName": "Onda",
        "FirstName": "Marin",
        "CarID": "26",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Site Manager"
    },
    {
        "LastName": "Orilla",
        "FirstName": "Kare",
        "CarID": "27",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Technician"
    },
    {
        "LastName": "Borrasca",
        "FirstName": "Isande",
        "CarID": "28",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Technician"
    },
    {
        "LastName": "Ovan",
        "FirstName": "Bertrand",
        "CarID": "29",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Facilities Group Manager"
    },
    {
        "LastName": "Resumir",
        "FirstName": "Felix",
        "CarID": "30",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Security Group Manager"
    },
    {
        "LastName": "Sanjorge Jr.",
        "FirstName": "Sten",
        "CarID": "31",
        "CurrentEmploymentType": "Executive",
        "CurrentEmploymentTitle": "President/CEO"
    },
    {
        "LastName": "Strum",
        "FirstName": "Orhan",
        "CarID": "32",
        "CurrentEmploymentType": "Executive",
        "CurrentEmploymentTitle": "SVP/COO"
    },
    {
        "LastName": "Tempestad",
        "FirstName": "Brand",
        "CarID": "33",
        "CurrentEmploymentType": "Engineering",
        "CurrentEmploymentTitle": "Drill Technician"
    },
    {
        "LastName": "Vann",
        "FirstName": "Edvard",
        "CarID": "34",
        "CurrentEmploymentType": "Security",
        "CurrentEmploymentTitle": "Perimeter Control"
    },
    {
        "LastName": "Vasco-Pais",
        "FirstName": "Willem",
        "CarID": "35",
        "CurrentEmploymentType": "Executive",
        "CurrentEmploymentTitle": "Environmental Safety Advisor"
    },
    {
        "LastName": "Hafon",
        "FirstName": "Albina",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Hawelon",
        "FirstName": "Benito",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Hawelon",
        "FirstName": "Claudio",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Mies",
        "FirstName": "Henk",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Morlun",
        "FirstName": "Valeria",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Morlun",
        "FirstName": "Adan",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Morluniau",
        "FirstName": "Cecilia",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Nant",
        "FirstName": "Irene",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    },
    {
        "LastName": "Scozzese",
        "FirstName": "Dylan",
        "CarID": "",
        "CurrentEmploymentType": "Facilities",
        "CurrentEmploymentTitle": "Truck Driver"
    }
]

export const storeButtonArr = {
    "Brew've Been Served": [{
        s: '7:30',
        e: '8:30',
        d: 1,
    }],
    "Hallowed Grounds": [{
        s: '7:30',
        e: '8:30',
        d: 2,
    }],
    "Coffee Cameleon": [{
        s: '7:30',
        e: '8:30',
        d: 3,
    }],
    "Coffee Shack": [{
        s: '11:45',
        e: '12:15',
        d: 1,
    }],
    "Bean There Done That": [{
        s: '11:45',
        e: '12:15',
        d: 2,
    }],
    "Jack's Magical Beans": [{
        s: '11:45',
        e: '12:15',
        d: 3,
    }],
    "Brewed Awakenings": [{
        s: '11:45',
        e: '12:15',
        d: 4,
    }],
    
    "Katerinas Caf": [{
        s: '13:00',
        e: '14:30',
        d: 1,
    }, {
        s: '18:50',
        e: '21:30',
        d: 1,
    }],
    "Gelatogalore": [{
        s: '13:00',
        e: '14:20',
        d: 5,
    }],
    "Ouzeri Elian": [{
        s: '13:00',
        e: '14:20',
        d: 3,
    }, {
        s: '19:00',
        e: '21:30',
        d: 3,
    }],
    "Kalami Kafenion": [{
        s: '13:10',
        e: '14:20',
        d: 4,
    }, {
        s: '19:00',
        e: '20:30',
        d: 4,
    }],
    "Hippokampos": [{
        s: '13:00',
        e: '14:00',
        d: 2,
    }, {
        s: '19:10',
        e: '22:30',
        d: 2,
    }],
    "Abila Zacharo": [{
        s: '13:00',
        e: '14:30',
        d: 7,
    }],
    "Guy's Gyros": [{
        s: '13:30',
        e: '14:30',
        d: 6,
    }, {
        s: '19:0',
        e: '21:40',
        d: 6,
    }],
    "Abila Airport": [{
        s: '8:26',
        e: '9:40',
        d: 1,
    }, {
        s: '12:20',
        e: '13:10',
        d: 1,
    }, {
        s: '15:20',
        e: '16:10',
        d: 1,
    }],
    "Nationwide Refinery": [{
        s: '10:00',
        e: '13:00',
        d: 5,
    }],
    "Maximum Iron and Steel": [{
        s: '10:10',
        e: '10:50',
        d: 1,
    }, {
        s: '14:50',
        e: '15:20',
        d: 1,
    }],
    "Carlyle Chemical Inc.": [{
        s: '9:40',
        e: '10:10',
        d: 1,
    },
    {
        s: '12:30',
        e: '13:00',
        d: 2,
    },
    {
        s: '14:30',
        e: '14:50',
        d: 1,
    },
    {
        s: '16:20',
        e: '17:20',
        d: 1,
    }],
    "Abila Scrapyard": [{
        s: '14:10',
        e: '14:30',
        d: 2,
    }],
    "Octavio's Office Supplies": [{
        s: '14:30',
        e: '16:00',
        d: 3,
    }],
    "Chostus Hotel": [{
        s: '12:10',
        e: '14:00',
        d: 8,
    }],
    "Frank's Fuel": [{
        s: '12:10',
        e: '12:40',
        d: 6,
    }, {
        s: '18:10',
        e: '18:50',
        d: 1,
    }],
    "Kronos Pipe and Irrigation": [{
        s: '14:00',
        e: '14:20',
        d: 8,
    }],
    "Stewart and Sons Fabrication": [{
        s: '10:20',
        e: '12:20',
        d: 7,
    }],
    "Albert's Fine Clothing": [{
        s: '15:20',
        e: '16:20',
        d: 2,
    }, {
        s: '19:00',
        e: '21:20',
        d: 5,
    }],
    "Kronos Mart": [{
        s: '3:10',
        e: '4:00',
        d: 1,
    }, {
        s: '7:30',
        e: '8:40',
        d: 4,
    }],
    "Daily Dealz": [{
        s: '5:50',
        e: '6:20',
        d: 1,
    }],
    "Shoppers' Delight": [{
        s: '15:10',
        e: '16:10',
        d: 7,
    }, {
        s: '19:20',
        e: '21:30',
        d: 7,
    }],
    "Ahaggo Museum": [{
        s: '15:00',
        e: '17:00',
        d: 8,
    }],
    "Desafio Golf Course": [{
        s: '13:00',
        e: '15:40',
        d: 9,
    }],
    "Roberts and Sons": [{
        s: '19:10',
        e: '21:30',
        d: 8,
    }],
    "U-Pump": [{
        s: '13:10',
        e: '13:30',
        d: 6,
    }, {
        s: '17:25',
        e: '17:55',
        d: 1,
    }],
    "General Grocer": [{
        s: '15:20',
        e: '16:00',
        d: 5,
    }, {
        s: '20:30',
        e: '21:40',
        d: 4,
    }],
    "Frydos Autosupply n' More": [{
        s: '15:30',
        e: '16:20',
        d: 4,
    }, {
        s: '19:00',
        e: '21:40',
        d: 9,
    }],
}



// export const storeButtonArr = {
//     "Brew've Been Served": [{
//         s: '7:20',
//         e: '7:50',
//         d: 1,
//     }],
//     "Hallowed Grounds": [{
//         s: '7:50',
//         e: '8:20',
//         d: 1,
//     }],
//     "Coffee Cameleon": [{
//         s: '8:20',
//         e: '8:50',
//         d: 1,
//     }],

//     "Coffee Shack": [{
//         s: '11:45',
//         e: '12:15',
//         d: 1,
//     }],
//     "Bean There Done That": [{
//         s: '11:45',
//         e: '12:15',
//         d: 2,
//     }],
//     "Jack's Magical Beans": [{
//         s: '11:45',
//         e: '12:15',
//         d: 3,
//     }],
//     "Brewed Awakenings": [{
//         s: '11:45',
//         e: '12:15',
//         d: 4,
//     }],
    
//     "Katerinas Caf": [{
//         s: '13:00',
//         e: '13:30',
//         d: 1,
//     }, {
//         s: '19:00',
//         e: '19:30',
//         d: 1,
//     }],
//     "Gelatogalore": [{
//         s: '13:30',
//         e: '14:00',
//         d: 1,
//     }],
//     "Ouzeri Elian": [{
//         s: '14:00',
//         e: '14:30',
//         d: 1,
//     }, {
//         s: '19:30',
//         e: '20:00',
//         d: 1,
//     }],
//     "Hippokampos": [{
//         s: '14:30',
//         e: '15:00',
//         d: 1,
//     }, {
//         s: '20:00',
//         e: '20:30',
//         d: 1,
//     }],
//     "Kalami Kafenion": [{
//         s: '15:00',
//         e: '15:30',
//         d: 1,
//     }, {
//         s: '20:30',
//         e: '21:00',
//         d: 1,
//     }],
//     "Abila Zacharo": [{
//         s: '12:30',
//         e: '13:00',
//         d: 1,
//     }],
//     "Guy's Gyros": [{
//         s: '15:30',
//         e: '16:00',
//         d: 1,
//     }, {
//         s: '21:00',
//         e: '21:30',
//         d: 1,
//     }],

//     // partner
//     "Abila Airport": [{
//         s: '8:30',
//         e: '9:00',
//         d: 2,
//     }, {
//         s: '12:30',
//         e: '13:00',
//         d: 2,
//     }, {
//         s: '15:30',
//         e: '16:00',
//         d: 2,
//     }],
//     "Nationwide Refinery": [{
//         s: '10:00',
//         e: '10:30',
//         d: 2,
//     }],
//     "Maximum Iron and Steel": [{
//         s: '10:30',
//         e: '11:00',
//         d: 2,
//     }, {
//         s: '14:50',
//         e: '15:20',
//         d: 2,
//     }],
//     "Carlyle Chemical Inc.": [{
//         s: '9:30',
//         e: '10:00',
//         d: 2,
//     },
//     {
//         s: '12:30',
//         e: '13:00',
//         d: 2,
//     },
//     {
//         s: '14:30',
//         e: '14:50',
//         d: 2,
//     },
//     {
//         s: '16:20',
//         e: '17:20',
//         d: 2,
//     }],
//     "Abila Scrapyard": [{
//         s: '14:10',
//         e: '14:30',
//         d: 2,
//     }],
//     "Octavio's Office Supplies": [{
//         s: '14:30',
//         e: '16:00',
//         d: 3,
//     }],
//     "Chostus Hotel": [{
//         s: '12:10',
//         e: '14:00',
//         d: 8,
//     }],
//     "Frank's Fuel": [{
//         s: '12:10',
//         e: '12:40',
//         d: 6,
//     }, {
//         s: '18:10',
//         e: '18:50',
//         d: 1,
//     }],
//     "Kronos Pipe and Irrigation": [{
//         s: '14:00',
//         e: '14:20',
//         d: 8,
//     }],
//     "Stewart and Sons Fabrication": [{
//         s: '10:20',
//         e: '12:20',
//         d: 7,
//     }],
//     "Albert's Fine Clothing": [{
//         s: '15:20',
//         e: '16:20',
//         d: 2,
//     }, {
//         s: '19:00',
//         e: '21:20',
//         d: 5,
//     }],
//     "Kronos Mart": [{
//         s: '3:10',
//         e: '4:00',
//         d: 1,
//     }, {
//         s: '7:30',
//         e: '8:40',
//         d: 4,
//     }],
//     "Daily Dealz": [{
//         s: '5:50',
//         e: '6:20',
//         d: 1,
//     }],
//     "Shoppers' Delight": [{
//         s: '15:10',
//         e: '16:10',
//         d: 7,
//     }, {
//         s: '19:20',
//         e: '21:30',
//         d: 7,
//     }],
//     "Ahaggo Museum": [{
//         s: '15:00',
//         e: '17:00',
//         d: 8,
//     }],
//     "Desafio Golf Course": [{
//         s: '13:00',
//         e: '15:40',
//         d: 9,
//     }],
//     "Roberts and Sons": [{
//         s: '19:10',
//         e: '21:30',
//         d: 8,
//     }],
//     "U-Pump": [{
//         s: '13:10',
//         e: '13:30',
//         d: 6,
//     }, {
//         s: '17:25',
//         e: '17:55',
//         d: 1,
//     }],
//     "General Grocer": [{
//         s: '15:20',
//         e: '16:00',
//         d: 5,
//     }, {
//         s: '20:30',
//         e: '21:40',
//         d: 4,
//     }],
//     "Frydos Autosupply n' More": [{
//         s: '15:30',
//         e: '16:20',
//         d: 4,
//     }, {
//         s: '19:00',
//         e: '21:40',
//         d: 9,
//     }],
// }