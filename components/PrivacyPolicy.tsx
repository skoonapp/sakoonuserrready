
import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            🔒 Privacy Policy
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed">
            <p className="font-semibold">प्रभावी तिथि: 1 अगस्त 2025</p>
            <p>SakoonApp आपकी गोपनीयता का सम्मान करता है और उसकी सुरक्षा के लिए प्रतिबद्ध है। यह नीति बताती है कि हम आपकी कौन सी जानकारी एकत्र करते हैं और उसका उपयोग कैसे करते हैं।</p>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">1. हम कौन सी जानकारी एकत्र करते हैं?</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>खाता जानकारी:</strong> जब आप साइन अप करते हैं, तो हम आपका नाम, ईमेल पता और मोबाइल नंबर जैसी जानकारी एकत्र करते हैं।</li>
                  <li><strong>भुगतान जानकारी:</strong> जब आप कोई प्लान खरीदते हैं, तो हमारा पेमेंट पार्टनर (Razorpay) आपके भुगतान को प्रोसेस करने के लिए आवश्यक जानकारी एकत्र करता है। हम आपके कार्ड का विवरण संग्रहीत नहीं करते हैं।</li>
                  <li><strong>उपयोग डेटा:</strong> हम यह जानकारी एकत्र करते हैं कि आप ऐप का उपयोग कैसे करते हैं, जैसे कि आप किन सुविधाओं का उपयोग करते हैं और ऐप पर कितना समय बिताते हैं, ताकि हम अपनी सेवाओं में सुधार कर सकें।</li>
                  <li><strong>बातचीत की गोपनीयता:</strong> आपकी कॉल या चैट पूरी तरह से आपके और Listener के बीच गोपनीय रहती है। SakoonApp आपकी बातचीत को रिकॉर्ड या संग्रहीत नहीं करता है।</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">2. जानकारी का उपयोग कैसे किया जाता है?</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>आपको हमारी सेवाएं प्रदान करने और आपके खाते का प्रबंधन करने के लिए।</li>
                  <li>भुगतान प्रक्रिया को सुरक्षित रूप से पूरा करने के लिए।</li>
                  <li>हमारी सेवाओं को बेहतर बनाने और उपयोगकर्ता अनुभव को बढ़ाने के लिए।</li>
                  <li>आपको महत्वपूर्ण अपडेट और ऑफ़र के बारे में सूचित करने के लिए।</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">3. जानकारी साझा करना</h3>
              <p>हम आपकी व्यक्तिगत जानकारी किसी तीसरे पक्ष को बेचते या किराए पर नहीं देते हैं। हम केवल इन स्थितियों में जानकारी साझा कर सकते हैं:
                <br/>- सेवा प्रदाताओं के साथ (जैसे पेमेंट गेटवे और कॉलिंग इंफ्रास्ट्रक्चर) जो हमारी सेवाओं को चलाने में मदद करते हैं।
                <br/>- कानूनी आवश्यकताओं का पालन करने के लिए, यदि कानून द्वारा आवश्यक हो।
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">4. डेटा सुरक्षा</h3>
              <p>हम आपकी जानकारी को अनधिकृत पहुंच से बचाने के लिए उद्योग-मानक सुरक्षा उपायों का उपयोग करते हैं।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">5. नीति में परिवर्तन</h3>
              <p>हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। कोई भी बदलाव इस पेज पर पोस्ट किया जाएगा।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">6. हमसे संपर्क करें</h3>
              <p>यदि इस नीति के बारे में आपके कोई प्रश्न हैं, तो कृपया हमें <a href="mailto:appsakoon@gmail.com" className="text-cyan-600 dark:text-cyan-300 hover:underline">appsakoon@gmail.com</a> पर संपर्क करें।</p>
            </div>
        </div>
        
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 text-right border-t border-slate-200 dark:border-slate-800">
             <button
                onClick={onClose}
                className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors"
             >
                बंद करें
             </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;