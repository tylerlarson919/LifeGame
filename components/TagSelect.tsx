import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@heroui/input';
import { FaArrowRightToBracket } from "react-icons/fa6";

interface Tag {
  key: string;
  label: string;
}

interface TagSelectProps {
  className?: string;
  label?: string;
  id?: string;
  placeholder?: string;
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  tags: Tag[];
}

const TagSelect: React.FC<TagSelectProps> = ({
  className,
  label,
  id,
  placeholder,
  selectedKeys,
  onSelectionChange,
  tags,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter tags based on input (case-insensitive)
  const filteredTags = tags.filter(tag =>
    tag.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tag: Tag) => {
    onSelectionChange(new Set([tag.key]));
    setInputValue(tag.label);
    setShowDropdown(false);
  };

  const handleAddNew = () => {
    if (inputValue.trim() !== '') {
      // Add new tag option and select it
      handleSelect({ key: inputValue, label: inputValue });
    }
  };

  return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
      {label && <label htmlFor={id} id={`${id}-label`}>{label}</label>}
      <Input
        id={id}
        placeholder={placeholder}
        value={inputValue}
        aria-labelledby={label ? `${id}-label` : undefined}
        onFocus={() => setShowDropdown(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowDropdown(true);
        }}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 dropdownStyle shadow-small mt-1 z-10 rounded-2xl">
            <div className='flex flex-col gap-0 py-2 w-full h-[150px] overflow-x-auto'>
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-100/20 rounded-lg p-2"
                    onClick={handleAddNew}>
                    <p>Add new</p>
                    <FaArrowRightToBracket className='w-4 h-4' />
                </div>
                {filteredTags.map(tag => (
                    <div
                    key={tag.key}
                    className="cursor-pointer hover:bg-gray-100/20 rounded-lg p-2"
                    onClick={() => handleSelect(tag)}
                    >
                    {tag.label}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default TagSelect;
