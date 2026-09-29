import React from 'react';
import { Modal } from '../common/Modal';
import { ExpenseCategory, Expense, UserRole } from '../../types/database.types';
import { ExpenseCategoryManager } from './ExpenseCategoryManager';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  categories: ExpenseCategory[];
  expenses: Expense[];
  onAddCategory: (name: string) => Promise<any>;
  onUpdateCategory: (id: string, name: string) => Promise<any>;
  onToggleActive: (id: string, isActive: boolean) => Promise<any>;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  categories,
  expenses,
  onAddCategory,
  onUpdateCategory,
  onToggleActive,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="খরচের ক্যাটাগরি ব্যবস্থাপনা"
      maxWidth="lg"
    >
      <ExpenseCategoryManager
        currentRole={currentRole}
        categories={categories}
        expenses={expenses}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory}
        onToggleActive={onToggleActive}
        isModal={true}
      />
    </Modal>
  );
};
