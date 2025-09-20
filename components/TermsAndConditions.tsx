
import React from 'react';

interface TermsAndConditionsProps {
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onClose }) => {
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
            📘 Terms & Conditions
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

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">1. हमारी सेवाएं (Our Services)</h3>
              <p>SakoonApp आपको भावनात्मक समर्थन और अपनी बात साझा करने के लिए प्रशिक्षित 'Listeners' से जुड़ने का एक मंच प्रदान करता है। कृपया ध्यान दें कि हमारे Listeners पेशेवर चिकित्सक, मनोवैज्ञानिक या चिकित्सा पेशेवर नहीं हैं। वे चिकित्सा सलाह, निदान या उपचार प्रदान नहीं करते हैं।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">2. उपयोगकर्ता की जिम्मेदारियां (User Responsibilities)</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>आप सभी Listeners और अन्य उपयोगकर्ताओं के साथ सम्मान और शिष्टाचार से पेश आने के लिए सहमत हैं।</li>
                  <li>आप किसी भी प्रकार की अनुचित, अपमानजनक, या आपत्तिजनक भाषा या व्यवहार में शामिल नहीं होंगे।</li>
                  <li>आप अपनी खाता जानकारी की सुरक्षा के लिए जिम्मेदार हैं।</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">3. प्लान और टोकन खरीदना (Purchasing Plans & Tokens)</h3>
              <p>आप ऐप के माध्यम से कॉलिंग मिनट, चैट संदेशों (DT Plans के रूप में) या टोकन खरीद सकते हैं। सभी खरीदारियां अंतिम हैं और आमतौर पर गैर-वापसी योग्य होती हैं। खरीदे गए DT प्लान की वैधता खरीदने की तारीख से 30 दिनों तक होती है, जिसके बाद अप्रयुक्त लाभ समाप्त हो जाएगा।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">4. गोपनीयता (Privacy)</h3>
              <p>आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। आपकी कॉल या चैट पूरी तरह से आपके और Listener के बीच गोपनीय रहती है। SakoonApp आपकी बातचीत को रिकॉर्ड या संग्रहीत नहीं करता है। हम आपकी जानकारी कैसे एकत्र और उपयोग करते हैं, इस बारे में अधिक जानकारी के लिए कृपया हमारी गोपनीयता नीति पढ़ें।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">5. निषिद्ध गतिविधियाँ (Prohibited Activities)</h3>
              <p>आप इस प्लेटफ़ॉर्म का उपयोग किसी भी अवैध, धमकी भरे, उत्पीड़न करने वाले या हानिकारक उद्देश्य के लिए नहीं करेंगे। नियमों का उल्लंघन करने पर आपका खाता बिना किसी पूर्व सूचना के अस्थायी या स्थायी रूप से निलंबित किया जा सकता है।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">6. धनवापसी नीति (Refund Policy)</h3>
              <p>आम तौर पर, सभी खरीदारियां गैर-वापसी योग्य होती हैं। भुगतान विफलता या तकनीकी समस्याओं जैसे असाधारण मामलों के लिए, कृपया हमारी रद्दीकरण/धनवापसी नीति देखें या सहायता के लिए हमसे संपर्क करें।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">7. शर्तों में बदलाव (Changes to Terms)</h3>
              <p>SakoonApp किसी भी समय इन नियमों और शर्तों को संशोधित करने का अधिकार सुरक्षित रखता है। हम आपको महत्वपूर्ण परिवर्तनों के बारे में सूचित करेंगे। ऐप का उपयोग जारी रखने का मतलब है कि आप संशोधित शर्तों से सहमत हैं।</p>
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

export default TermsAndConditions;