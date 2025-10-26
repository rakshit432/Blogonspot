import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiArrowRight, FiBookOpen, FiUsers, FiStar, FiZap } from "react-icons/fi";

export default function Onboarding({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <FiBookOpen className="onboarding-icon" />,
      title: "Welcome to BlogOnSpot!",
      description: "Your new home for sharing ideas, stories, and connecting with amazing creators.",
      features: [
        "Write and publish your own blog posts",
        "Discover content from verified creators",
        "Get AI-powered summaries of any content"
      ]
    },
    {
      icon: <FiUsers className="onboarding-icon" />,
      title: "Connect with Creators",
      description: "Follow your favorite writers and get exclusive subscriber-only content.",
      features: [
        "Subscribe to verified creators",
        "Access premium content",
        "Build your reading community"
      ]
    },
    {
      icon: <FiZap className="onboarding-icon" />,
      title: "AI-Powered Features",
      description: "Get instant summaries of any content with our smart AI assistant.",
      features: [
        "One-click content summarization",
        "Smart content recommendations",
        "Enhanced reading experience"
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="onboarding-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="onboarding-header">
            <button className="onboarding-close" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="onboarding-content">
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="onboarding-step">
                {steps[currentStep].icon}
                <h2 className="onboarding-title">{steps[currentStep].title}</h2>
                <p className="onboarding-description">{steps[currentStep].description}</p>
                
                <div className="onboarding-features">
                  {steps[currentStep].features.map((feature, index) => (
                    <div key={index} className="onboarding-feature">
                      <FiCheck className="feature-icon" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="onboarding-progress">
              <div className="progress-bar">
                {steps.map((_, index) => (
                  <div 
                    key={index}
                    className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div className="progress-text">
                {currentStep + 1} of {steps.length}
              </div>
            </div>

            <div className="onboarding-actions">
              {currentStep > 0 && (
                <button className="btn ghost" onClick={prevStep}>
                  Back
                </button>
              )}
              <button className="btn" onClick={nextStep}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <FiArrowRight />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
