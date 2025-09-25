import type { Plan, FaqItem } from './types';

// Centralized array of listener images to ensure consistency.
export const LISTENER_IMAGES = [
    'https://images.unsplash.com/photo-1598128558393-70ff21433be0?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607346256330-1689574ce33b?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-57551c1bb8ae?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599425483443-5e1e2a5c4314?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=256&auto=format&fit=crop'
];


// Other application constants
export const FREE_MESSAGES_ON_SIGNUP = 5;

// NEW: Updated Plan structure for the new paymentService
export const CALL_PLANS: Plan[] = [
    { type: "call", name: "Bronze Pack", duration: "5 मिनट", minutes: 5, price: 50, tierName: 'Bronze Pack' },
    { type: "call", name: "Silver Pack", duration: "10 मिनट", minutes: 10, price: 99, tierName: 'Silver Pack', discount: 1 },
    { type: "call", name: "Gold Pack", duration: "15 मिनट", minutes: 15, price: 145, tierName: 'Gold Pack', discount: 3 },
    { type: "call", name: "Platinum Pack", duration: "30 मिनट", minutes: 30, price: 270, tierName: 'Platinum Pack', discount: 10 },
    { type: "call", name: "Diamond Pack", duration: "45 मिनट", minutes: 45, price: 410, tierName: 'Diamond Pack', discount: 9 },
    { type: "call", name: "Elite Pack", duration: "60 मिनट", minutes: 60, price: 540, tierName: 'Elite Pack', discount: 10 },
];

export const CHAT_PLANS: Plan[] = [
    { type: "chat", name: "Bronze Chat", duration: "5 मिनट", messages: 8, price: 20 },
    { type: "chat", name: "Silver Chat", duration: "10 मिनट", messages: 15, price: 36, discount: 4 },
    { type: "chat", name: "Gold Chat", duration: "15 मिनट", messages: 21, price: 50, discount: 5 },
    { type: "chat", name: "Platinum Chat", duration: "30 मिनट", messages: 40, price: 90, discount: 10 },
    { type: "chat", name: "Diamond Chat", duration: "45 मिनट", messages: 60, price: 135, discount: 10 },
    { type: "chat", name: "Elite Chat", duration: "60 मिनट", messages: 75, price: 170, discount: 10 },
];


export const FAQ_DATA: FaqItem[] = [
    {
        question: 'SakoonApp क्या है?',
        answer: 'SakoonApp एक ऐसा प्लेटफॉर्म है जहां आप अपनी भावनाओं को साझा करने और भावनात्मक समर्थन पाने के लिए प्रशिक्षित Listeners से जुड़ सकते हैं।',
        isPositive: true,
    },
    {
        question: 'क्या मेरी बातचीत गोपनीय रहती है?',
        answer: 'हाँ, आपकी सभी बातचीत पूरी तरह से गोपनीय और सुरक्षित हैं। हम आपकी गोपनीयता को गंभीरता से लेते हैं।',
        isPositive: true,
    },
    {
        question: 'क्या Listeners पेशेवर चिकित्सक हैं?',
        answer: 'नहीं, हमारे Listeners पेशेवर चिकित्सक या काउंसलर नहीं हैं। वे सहानुभूतिपूर्ण व्यक्ति हैं जिन्हें सक्रिय रूप से सुनने के लिए प्रशिक्षित किया गया है। वे चिकित्सा सलाह नहीं देते हैं।',
        isPositive: false,
    },
    {
        question: 'मैं एक प्लान कैसे खरीदूं?',
        answer: 'आप "होम" टैब पर जाकर कॉलिंग/चैट प्लान या MT प्लान खरीद सकते हैं। भुगतान सुरक्षित रूप से किया जाता है।',
        isPositive: true,
    },
    {
        question: 'DT प्लान का उपयोग कैसे करें?',
        answer: 'DT (Direct Time) प्लान को हमेशा प्राथमिकता दी जाती है। अगर आपके पास कोई खरीदा हुआ DT प्लान (जैसे 30 मिनट का कॉल प्लान) है, तो ऐप हमेशा पहले उसी का उपयोग करेगा। इससे यह सुनिश्चित होता है कि आप हमेशा पहले अपने सबसे किफायती प्लान का उपयोग करें।',
        isPositive: true,
    },
    {
        question: 'MT (Money Token) का उपयोग कैसे करें?',
        answer: 'MT (Money Token) का उपयोग केवल तभी किया जाएगा जब आपके पास कोई सक्रिय DT प्लान नहीं होगा। कॉल के लिए 2 MT प्रति मिनट और चैट के लिए 1 MT में 2 मैसेज की लागत आती है।',
        isPositive: true,
    },
    {
        question: 'रिचार्ज या रिफंड में समस्या होने पर क्या करें?',
        answer: 'अगर आपका भुगतान हो गया है लेकिन प्लान या MT नहीं मिले हैं, तो चिंता न करें। आमतौर पर, पैसा 5-7 व्यावसायिक दिनों में अपने आप वापस आ जाता है। अगर ऐसा नहीं होता है, तो कृपया हमें अपनी भुगतान रसीद (transaction receipt) के साथ **appsakoon@gmail.com** पर ईमेल करें। हम आपकी तुरंत मदद करेंगे।',
        isPositive: true,
    },
];

export const TESTIMONIALS_DATA = [
    {
        name: 'प्रिया S.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'जब मैं अकेला महसूस कर रही थी, तब SakoonApp ने मुझे एक दोस्त दिया जिससे मैं बात कर सकती थी। इसने वास्तव में मेरी मदद की।',
    },
    {
        name: 'अमित K.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'बिना किसी जजमेंट के किसी से बात करना बहुत ताज़गी भरा था। Listener बहुत समझदार और सहायक थे।',
    },
    {
        name: 'सुनीता M.',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'यह ऐप उन लोगों के लिए एक बेहतरीन पहल है जो सिर्फ अपने मन की बात कहना चाहते हैं। मैं इसकी बहुत सराहना करती हूँ।',
    },
];