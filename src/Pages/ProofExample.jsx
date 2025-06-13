// ProofExamplePopup.jsx
import React from "react";

const ProofExamplePopup = ({ isOpen, onClose, title, examples }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
                <button className="absolute top-2 right-3 text-gray-500 hover:text-red-600" onClick={onClose}>✕</button>
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examples.map((ex, idx) => (
                        <div key={idx} className="border p-3 rounded-lg">
                            <img src={ex.imageUrl} alt={`Example ${idx + 1}`} className="w-full h-88 object-cover mb-2 rounded" />
                            <p className={`text-sm font-semibold ${ex.valid ? "text-green-600" : "text-red-600"}`}>
                                {ex.valid ? "✅ Valid Example" : "❌ Invalid Example"}
                            </p>
                            <p className="text-gray-700 text-sm">{ex.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProofExamplePopup;
