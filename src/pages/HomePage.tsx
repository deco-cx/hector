import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const HomePage: React.FC = () => {
  const { currentLanguage } = useAppContext();
  
  const title = currentLanguage === 'EN' 
    ? 'Hector - AI App Builder' 
    : 'Hector - Construtor de Apps com IA';
  
  const description = currentLanguage === 'EN'
    ? 'Create custom AI-powered applications without coding.'
    : 'Crie aplicativos personalizados com IA sem programação.';
  
  const features = currentLanguage === 'EN'
    ? [
        'No-code interface',
        'AI-powered content generation',
        'Customizable templates',
        'Export your apps'
      ]
    : [
        'Interface sem código',
        'Geração de conteúdo com IA',
        'Templates personalizáveis',
        'Exporte seus apps'
      ];
  
  const ctaText = currentLanguage === 'EN'
    ? 'Get Started'
    : 'Começar';
  
  const appsText = currentLanguage === 'EN'
    ? 'My Apps'
    : 'Meus Apps';
  
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">{title}</h1>
          <p className="py-6">{description}</p>
          
          <div className="flex flex-col items-center mb-8">
            <ul className="steps steps-vertical">
              {features.map((feature, index) => (
                <li key={index} className="step step-primary">{feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create" className="btn btn-primary">{ctaText}</Link>
            <Link to="/apps" className="btn btn-outline">{appsText}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 