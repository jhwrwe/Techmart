'use client'

interface DeleteCategoryButtonProps {
  categoryId: number
  categoryName: string
  productCount: number
  deleteAction: (formData: FormData) => Promise<void>
}

export default function DeleteCategoryButton({ 
  categoryId, 
  categoryName, 
  productCount, 
  deleteAction 
}: DeleteCategoryButtonProps) {
  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault()
    
    const confirmMessage = productCount > 0 
      ? `Are you sure you want to delete "${categoryName}"? This will remove the category from ${productCount} product(s).`
      : `Are you sure you want to delete "${categoryName}"?`
    
    if (confirm(confirmMessage)) {
      const formData = new FormData()
      formData.append('categoryId', categoryId.toString())
      deleteAction(formData)
    }
  }

  return (
    <form onSubmit={handleDelete} className="flex-1">
      <input type="hidden" name="categoryId" value={categoryId} />
      <button
        type="submit"
        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Delete
      </button>
    </form>
  )
}