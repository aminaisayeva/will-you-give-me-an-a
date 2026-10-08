"use client";

import { useState } from 'react';
import { Images, Grid3X3, List, Search, Heart, Share, Download } from 'lucide-react';

export default function PhotosWindow() {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Generate some placeholder photos representing portfolio work
  const photos = [
    {
      id: 1,
      title: 'Terminal Interface',
      description: 'Custom terminal emulator with virtual filesystem',
      category: 'UI/UX',
      date: 'Today',
      size: '1920x1080',
      color: '#000000'
    },
    {
      id: 2,
      title: 'macOS Desktop',
      description: 'Interactive desktop environment recreation',
      category: 'Web Development',
      date: 'Today',
      size: '2560x1440',
      color: '#1e40af'
    },
    {
      id: 3,
      title: 'Window Manager',
      description: 'Draggable and resizable window system',
      category: 'Frontend',
      date: 'Yesterday',
      size: '1440x900',
      color: '#059669'
    },
    {
      id: 4,
      title: 'Database Schema',
      description: 'PostgreSQL database design for portfolio system',
      category: 'Backend',
      date: 'Yesterday',
      size: '1680x1050',
      color: '#dc2626'
    },
    {
      id: 5,
      title: 'API Architecture',
      description: 'RESTful API design with TypeScript',
      category: 'Backend',
      date: '2 days ago',
      size: '1920x1200',
      color: '#7c3aed'
    },
    {
      id: 6,
      title: 'Component Library',
      description: 'React components with Tailwind CSS',
      category: 'Frontend',
      date: '3 days ago',
      size: '1600x900',
      color: '#ea580c'
    }
  ];

  const categories = ['All', 'UI/UX', 'Frontend', 'Backend', 'Web Development'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPhotos = selectedCategory === 'All' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  return (
    <div className="h-full bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Images className="w-6 h-6 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Photos</h2>
            <span className="text-sm text-gray-500">{filteredPhotos.length} items</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos"
                className="pl-9 pr-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
            
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Photos Grid/List */}
        <div className={`flex-1 p-4 overflow-y-auto ${selectedPhoto ? 'w-2/3' : 'w-full'}`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: photo.color }}
                  onClick={() => setSelectedPhoto(photo.id)}
                >
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold mb-1">
                        {photo.title.split(' ').map(word => word[0]).join('')}
                      </div>
                      <div className="text-xs opacity-75">{photo.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                  onClick={() => setSelectedPhoto(photo.id)}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: photo.color }}
                  >
                    {photo.title.split(' ').map(word => word[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">{photo.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{photo.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{photo.date}</div>
                    <div className="text-xs text-gray-400">{photo.size}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo Detail */}
        {selectedPhoto && (
          <div className="w-1/3 overflow-y-auto border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Details</h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>

              {(() => {
                const photo = filteredPhotos.find(p => p.id === selectedPhoto);
                if (!photo) return null;

                return (
                  <>
                    {/* Photo Preview */}
                    <div
                      className="w-full h-32 rounded-lg mb-4 flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: photo.color }}
                    >
                      {photo.title.split(' ').map(word => word[0]).join('')}
                    </div>

                    {/* Photo Info */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {photo.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {photo.description}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category</span>
                          <span className="text-gray-800 dark:text-gray-200">{photo.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Size</span>
                          <span className="text-gray-800 dark:text-gray-200">{photo.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="text-gray-800 dark:text-gray-200">{photo.date}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button className="flex-1 flex items-center justify-center space-x-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">Like</span>
                        </button>
                        <button className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                          <Share className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}