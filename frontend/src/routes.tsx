import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import CombinedSearch from './pages/CombinedSearch';
import FullTextSearch from './pages/FullTextSearch';
import SemanticSearch from './pages/SemanticSearch';
import SkillsRating from './pages/SkillsRating';
import BooleanSearch from './pages/BooleanSearch';
import Templates from './pages/Templates';

const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<CombinedSearch />} />
      <Route path="/combined" element={<CombinedSearch />} />
      <Route path="/fulltext" element={<FullTextSearch />} />
      <Route path="/semantic" element={<SemanticSearch />} />
      <Route path="/boolean" element={<BooleanSearch />} />
      <Route path="/skills" element={<SkillsRating />} />
      <Route path="/templates" element={<Templates />} />
    </RouterRoutes>
  );
};

export default Routes; 