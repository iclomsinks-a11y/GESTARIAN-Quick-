import React, { useState, useRef } from 'react';
import {
  X,
  Search,
  Package,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Check,
  Tag,
  Euro,
  FileText,
  Sparkles,
} from 'lucide-react';
import { BillableProduct } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProductsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: BillableProduct[];
  onSelectProduct?: (product: BillableProduct) => void;
  onSaveProduct: (product: BillableProduct) => void;
  onDeleteProduct: (id: string) => void;
  mode?: 'select' | 'manage';
  targetLineLabel?: string;
}

export const ProductsDatabaseModal: React.FC<ProductsDatabaseModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onSaveProduct,
  onDeleteProduct,
  mode = 'select',
  targetLineLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BillableProduct | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Extract unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c && c.trim())))
  );

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleStartCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('');
    setFormDescription('');
    setFormImageUrl('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleStartEdit = (p: BillableProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormPrice(p.price !== undefined ? p.price.toString() : '');
    setFormCategory(p.category || '');
    setFormDescription(p.description || '');
    setFormImageUrl(p.imageUrl || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      setFormError('La imagen no debe superar los 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormImageUrl(result);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El concepto del producto es obligatorio.');
      return;
    }

    const numericPrice = formPrice.trim() !== '' ? parseFloat(formPrice.replace(',', '.')) : undefined;

    const newProduct: BillableProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: formName.trim(),
      price: isNaN(numericPrice as number) ? undefined : numericPrice,
      category: formCategory.trim() || undefined,
      description: formDescription.trim() || undefined,
      imageUrl: formImageUrl.trim() || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : Date.now(),
    };

    onSaveProduct(newProduct);
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div
      id="products-db-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl shadow-2xl my-6 overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>Base de Datos de Productos Facturables</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  {products.length} Productos
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === 'select'
                  ? targetLineLabel
                    ? `Haz clic en un producto para poner su nombre en la ${targetLineLabel}.`
                    : 'Escoge un producto de la lista para poner su nombre en la línea de concepto.'
                  : 'Catálogo de productos con concepto e imagen adjunta para facturación instantánea.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="products-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por concepto, categoría o descripción..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Toggle Add Product Form Button */}
            <button
              type="button"
              id="products-btn-add-new"
              onClick={handleStartCreate}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Nuevo Producto</span>
            </button>
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* FORM: Create or Edit Billable Product */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveForm}
              className="p-5 rounded-2xl bg-neutral-950 border border-amber-400/40 space-y-4 shadow-xl animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
                    {editingProduct ? 'Editar Producto Facturable' : 'Subir Nuevo Producto con Imagen y Concepto'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Upload Column */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Imagen Adjunta al Concepto
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {formImageUrl ? (
                    <div className="relative group rounded-xl border border-neutral-700 bg-neutral-900 p-2 flex flex-col items-center justify-center aspect-square max-h-48 overflow-hidden">
                      <img
                        src={formImageUrl}
                        alt="Vista previa"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                      <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-xs">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 rounded bg-amber-400 text-neutral-950 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3 text-[#EF4444]" style={{ color: '#EF4444' }} /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-neutral-700/70 hover:border-amber-400 aspect-square max-h-48 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group"
                      style={{ backgroundColor: 'rgba(128, 128, 128, 0.05)' }}
                    >
                      <ImageIcon className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-neutral-300 group-hover:text-amber-300">
                        Subir Imagen
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">
                        JPG, PNG, WebP o SVG
                      </span>
                    </div>
                  )}
                </div>

                {/* Concept and Details Column */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Concepto del Producto (se pondrá en la factura) *
                    </label>
                    <textarea
                      rows={2}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Cortina confeccionada a medida lino rústico lavado cabezilla 200%"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Precio Unitario (€) (Opcional)
                      </label>
                      <div className="relative">
                        <Euro className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Categoría (Opcional)
                      </label>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          placeholder="Ej: Confección, Automatismos..."
                          className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Descripción Técnica / Notas complementarias (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Ej: Incluye fijación oculta y plomo inferior 50gr."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      {editingProduct ? 'Actualizar Producto' : 'Guardar Producto en Base de Datos'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Products Grid / List */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-neutral-950/50 rounded-2xl border border-neutral-800">
              <Package className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">
                {searchTerm
                  ? 'No se encontraron productos con ese término de búsqueda.'
                  : 'Aún no hay productos en la base de datos.'}
              </p>
              <button
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Subir Primer Producto Facturable</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProducts.map((product) => {
                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/80 transition-all flex gap-3.5 items-start group shadow-sm hover:shadow-lg hover:shadow-amber-400/5 relative"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-600" />
                      )}
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        {product.category && (
                          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full inline-block mb-1">
                            {product.category}
                          </span>
                        )}

                        <h4 className="text-xs sm:text-sm font-bold text-neutral-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                          {product.name}
                        </h4>

                        {product.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-neutral-900">
                        {product.price !== undefined && product.price > 0 ? (
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {formatCurrency(product.price)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 italic">Precio a convenir</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(product);
                            }}
                            className="p-1 rounded-lg text-[#808080] hover:text-white hover:bg-neutral-800 transition-colors"
                            style={{ color: '#808080' }}
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#808080]" style={{ color: '#808080' }} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar "${product.name}" de la base de productos?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1 rounded-lg text-[#EF4444] hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            style={{ color: '#EF4444' }}
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                          </button>

                          {/* Select / Attach Button */}
                          {onSelectProduct && (
                            <button
                              type="button"
                              id={`btn-select-product-${product.id}`}
                              onClick={() => onSelectProduct(product)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ml-1"
                              title="Poner el nombre de este producto en la línea de concepto"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Poner en Factura</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Los productos quedan guardados en la base de datos local para facturar rápidamente.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
