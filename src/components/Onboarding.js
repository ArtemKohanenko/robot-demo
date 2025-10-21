import React, { useState } from 'react';
import './Onboarding.css';

function Onboarding({ isCompleted = false }) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: 'Шаг 1/3',
      text: [
        'Задание: добраться до дома робота-Профессора, чтобы забрать посылку',
        'Для этого нужно сделать 5 шагов вперед.',
        'Шаги измеряются в клеточках (1 клетка = 1 шаг).'
      ]
    },
    {
      title: 'Шаг 2/3',
      text: [
        'Перенеси блоки на холст',
        'План для блоков:',
        'Когда нажимаешь ',
        'Сделать 5 шагов'
      ]
    },
    {
      title: 'Шаг 3/3',
      text: [
        'Нажми кнопку “Запустить”, программа запустится '
      ]
    }
  ];

  const completedPage = {
    title: 'Шаг 3/3',
    text: [
        'Ты прошёл уровень, молодец!'
    ]
  }

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const displayPage = isCompleted ? completedPage : pages[currentPage];

  return (
    <div className="gesture-onboarding-container">
      <h2 className="onboarding-title">{displayPage.title}</h2>
      <div className="onboarding-text">
        {displayPage.text.map((paragraph, index) => (
          <p key={index} className="onboarding-paragraph">{paragraph}</p>
        ))}
      </div>
      
      {
        isCompleted ?
          <div className="onboarding-navigation">
            <button 
              className="done-button"
            >
              ✓ Готово
            </button>
          </div>
        :
        <div className="onboarding-navigation">
            <button 
              className="nav-button"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
            >
              <img src="images/Arrow.svg" style={{ transform: 'rotate(180deg)' }}/>
            </button>
            <button 
              className="nav-button"
              onClick={goToNextPage}
              disabled={currentPage === pages.length - 1}
            >
              <img src="images/Arrow.svg"/>
            </button>
          </div>
      }
    </div>
  );
}

export default Onboarding;

