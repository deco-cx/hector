import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { AppConfiguration } from '../../types/app';
import Loading from '../../components/Loading';

const CreateAppPage: React.FC = () => {
  const { createApp, currentLanguage, loading } = useAppContext();
  const navigate = useNavigate();
  
  const [appName, setAppName] = useState('');
  const [template, setTemplate] = useState('form');
  const [style, setStyle] = useState('minimalistic');
  const [step, setStep] = useState(1);
  
  const titleText = currentLanguage === 'EN' ? 'Create New App' : 'Criar Novo App';
  const nameLabel = currentLanguage === 'EN' ? 'App Name' : 'Nome do App';
  const templateLabel = currentLanguage === 'EN' ? 'Template' : 'Modelo';
  const styleLabel = currentLanguage === 'EN' ? 'Style' : 'Estilo';
  const nextButtonText = currentLanguage === 'EN' ? 'Next' : 'Próximo';
  const backButtonText = currentLanguage === 'EN' ? 'Back' : 'Voltar';
  const createButtonText = currentLanguage === 'EN' ? 'Create App' : 'Criar App';
  const cancelButtonText = currentLanguage === 'EN' ? 'Cancel' : 'Cancelar';
  
  const handleSubmit = async () => {
    if (!appName.trim()) return;
    
    const appId = appName.toLowerCase().replace(/\s+/g, '_');
    
    const newApp: AppConfiguration = {
      id: appId,
      name: appName,
      template,
      style,
      inputs: [],
      actions: [],
      output: {
        type: 'html',
        files: []
      }
    };
    
    const success = await createApp(newApp);
    if (success) {
      navigate(`/edit/${appId}`);
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{titleText}</h1>
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="mb-6">
            <ul className="steps w-full">
              <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>
                {currentLanguage === 'EN' ? 'Basic Info' : 'Informações Básicas'}
              </li>
              <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>
                {currentLanguage === 'EN' ? 'Inputs' : 'Entradas'}
              </li>
              <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>
                {currentLanguage === 'EN' ? 'Actions' : 'Ações'}
              </li>
              <li className={`step ${step >= 4 ? 'step-primary' : ''}`}>
                {currentLanguage === 'EN' ? 'Output' : 'Saída'}
              </li>
            </ul>
          </div>
          
          {step === 1 && (
            <div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{nameLabel}</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder={currentLanguage === 'EN' ? 'My Awesome App' : 'Meu App Incrível'}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{templateLabel}</span>
                </label>
                <select 
                  className="select select-bordered w-full" 
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="form">Form</option>
                  <option value="quiz" disabled>Quiz (WIP)</option>
                </select>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{styleLabel}</span>
                </label>
                <select 
                  className="select select-bordered w-full" 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="minimalistic">Minimalistic</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="classic">Classic</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="card-actions justify-end mt-4">
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/apps')}
            >
              {cancelButtonText}
            </button>
            
            {step > 1 && (
              <button 
                className="btn btn-outline" 
                onClick={() => setStep(step - 1)}
              >
                {backButtonText}
              </button>
            )}
            
            {step < 4 ? (
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !appName.trim()}
              >
                {nextButtonText}
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={!appName.trim()}
              >
                {createButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAppPage; 