import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Language } from '../types/app';

const Header: React.FC = () => {
  const { currentLanguage, setLanguage } = useAppContext();

  const toggleLanguage = () => {
    const newLanguage: Language = currentLanguage === 'EN' ? 'PT' : 'EN';
    setLanguage(newLanguage);
  };

  return (
    <header className="navbar bg-base-100 shadow-md">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/">{currentLanguage === 'EN' ? 'Home' : 'Início'}</Link></li>
            <li><Link to="/apps">{currentLanguage === 'EN' ? 'My Apps' : 'Meus Apps'}</Link></li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost normal-case text-xl">Hector</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/">{currentLanguage === 'EN' ? 'Home' : 'Início'}</Link></li>
          <li><Link to="/apps">{currentLanguage === 'EN' ? 'My Apps' : 'Meus Apps'}</Link></li>
        </ul>
      </div>
      <div className="navbar-end">
        <button className="btn btn-ghost" onClick={toggleLanguage}>
          {currentLanguage === 'EN' ? 'PT' : 'EN'}
        </button>
      </div>
    </header>
  );
};

export default Header; 