import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const AppListPage: React.FC = () => {
  const { apps, loadApps, loading, error, currentLanguage } = useAppContext();
  
  useEffect(() => {
    loadApps();
  }, [loadApps]);
  
  const title = currentLanguage === 'EN' ? 'My Apps' : 'Meus Apps';
  const createButtonText = currentLanguage === 'EN' ? 'Create New App' : 'Criar Novo App';
  const noAppsText = currentLanguage === 'EN' 
    ? 'You have no apps yet. Create your first app to get started!' 
    : 'Você ainda não tem apps. Crie seu primeiro app para começar!';
  const editText = currentLanguage === 'EN' ? 'Edit' : 'Editar';
  const runText = currentLanguage === 'EN' ? 'Run' : 'Executar';
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Link to="/create" className="btn btn-primary">
          {createButtonText}
        </Link>
      </div>
      
      {error && <ErrorMessage />}
      
      {apps.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <p>{noAppsText}</p>
            <div className="card-actions justify-center mt-4">
              <Link to="/create" className="btn btn-primary">
                {createButtonText}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((appId) => (
            <div key={appId} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{appId.replace('.json', '')}</h2>
                <div className="card-actions justify-end mt-4">
                  <Link to={`/edit/${appId.replace('.json', '')}`} className="btn btn-sm btn-outline">
                    {editText}
                  </Link>
                  <Link to={`/run/${appId.replace('.json', '')}`} className="btn btn-sm btn-primary">
                    {runText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppListPage; 