
"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Plus,
  Trash2,
  Calendar,
  Image as ImageIcon,
  Loader2,
  X,
  Sparkles,
  Wand2,
  Star,
  Eye,
} from "lucide-react";

const SEED_DATA = [
  {
    title: "Soirée Jazz & Cocktails",
    description:
      "Une ambiance feutrée avec le meilleur du jazz live, accompagné de nos cocktails signature créés par notre mixologue.",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=1000&auto=format&fit=crop",
    isFeatured: true,
  },
  {
    title: "Yoga au Lever du Soleil",
    description:
      "Commencez votre journée en douceur avec une séance de yoga sur notre terrasse panoramique face à l'océan.",
    imageUrl:
      "https://images.unsplash.com/photo-1544367563-12123d8959bd?q=80&w=1000&auto=format&fit=crop",
    isFeatured: false,
  },
  {
    title: "Dégustation de Vins",
    description:
      "Découvrez les grands crus de la région avec notre sommelier passionné. Une expérience gustative inoubliable.",
    imageUrl:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop",
    isFeatured: false,
  },
  {
    title: "Atelier Cuisine Gastronomique",
    description:
      "Apprenez les secrets de notre chef étoilé lors d'un atelier interactif suivi d'un déjeuner dégustation.",
    imageUrl:
      "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000&auto=format&fit=crop",
    isFeatured: false,
  },
];

interface Experience {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  createdAt: any;
  isFeatured?: boolean;
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const hasFeatured = experiences.some((e) => e.isFeatured);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const q = query(collection(db, "experiences"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Experience[];
      setExperiences(docs);
    } catch (error) {
      console.error("Erreur lors du chargement des expériences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeatured = async (experience: Experience, newValue: boolean) => {
    try {
      const batch = writeBatch(db);

      if (newValue) {
        const q = query(collection(db, "experiences"), where("isFeatured", "==", true));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((d) => {
          if (d.id !== experience.id) {
            batch.update(d.ref, { isFeatured: false });
          }
        });
      }

      const docRef = doc(db, "experiences", experience.id);
      batch.update(docRef, { isFeatured: newValue });
      await batch.commit();

      fetchExperiences();
      if (selectedExperience?.id === experience.id) {
        setSelectedExperience({ ...experience, isFeatured: newValue });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleSeed = async () => {
    if (!confirm("Voulez-vous générer 4 exemples d'événements ?")) return;

    setLoading(true);
    try {
      const hasFeaturedInSeed = SEED_DATA.some((s) => s.isFeatured);
      if (hasFeaturedInSeed) {
        const batch = writeBatch(db);
        const q = query(collection(db, "experiences"), where("isFeatured", "==", true));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((d) => {
          batch.update(d.ref, { isFeatured: false });
        });
        await batch.commit();
      }

      const promises = SEED_DATA.map((item: any, index: number) => {
        const dt = new Date();
        dt.setDate(dt.getDate() + (index + 1) * 2);
        dt.setHours(18 + index, 0, 0, 0);

        return addDoc(collection(db, "experiences"), {
          ...item,
          date: dt.toISOString(),
          createdAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);
      fetchExperiences();
    } catch (error) {
      console.error("Erreur seed:", error);
      alert("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !imageFile) {
      alert("Veuillez remplir tous les champs et ajouter une image");
      return;
    }

    setSubmitting(true);
    try {
      const storageRef = ref(storage, `experiences/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (isFeatured) {
        const batch = writeBatch(db);
        const q = query(collection(db, "experiences"), where("isFeatured", "==", true));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((d) => {
          batch.update(d.ref, { isFeatured: false });
        });
        await batch.commit();
      }

      await addDoc(collection(db, "experiences"), {
        title,
        description,
        date,
        imageUrl: downloadURL,
        isFeatured,
        createdAt: serverTimestamp(),
      });

      setIsModalOpen(false);
      resetForm();
      fetchExperiences();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Une erreur est survenue lors de l'ajout de l'expérience");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette expérience ?")) return;
    try {
      await deleteDoc(doc(db, "experiences", id));
      fetchExperiences();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setImageFile(null);
    setImagePreview(null);
    setIsFeatured(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-playfair mb-2">Expériences & Événements</h1>
          <p className="text-gray-400">Gérez les événements affichés sur l'application mobile</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSeed}
            className="bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition-colors border border-white/10"
          >
            <Wand2 className="w-5 h-5" />
            Générer exemples
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-primary-gold hover:bg-primary-gold-dark text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un événement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((experience) => (
          <div
            key={experience.id}
            className="bg-secondary-black rounded-2xl overflow-hidden border border-white/5 group hover:border-primary-gold/30 transition-all"
          >
            <div className="aspect-video relative overflow-hidden bg-gray-800">
              <img
                src={experience.imageUrl}
                alt={experience.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {experience.isFeatured && (
                  <div className="p-2 bg-primary-gold text-black rounded-full shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedExperience(experience)}
                  className="p-2 bg-black/50 hover:bg-blue-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(experience.id)}
                  className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary-gold text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(experience.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white font-playfair">{experience.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{experience.description}</p>
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500 bg-secondary-black/50 rounded-2xl border border-white/5 border-dashed">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucune expérience programmée</p>
            <p className="text-sm">Cliquez sur "Ajouter un événement" pour commencer</p>
          </div>
        )}
      </div>

      {selectedExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-secondary-black rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 sm:h-80">
              <img
                src={selectedExperience.imageUrl}
                alt={selectedExperience.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-secondary-black to-transparent"></div>
              <button
                onClick={() => setSelectedExperience(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-primary-gold text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(selectedExperience.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white font-playfair">{selectedExperience.title}</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedExperience.isFeatured ? "bg-primary-gold text-black" : "bg-white/10 text-gray-400"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${selectedExperience.isFeatured ? "fill-current" : ""}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Mise en avant</p>
                    <p className="text-xs text-gray-400">
                      {selectedExperience.isFeatured
                        ? "Cet événement est affiché en premier sur l'accueil"
                        : "Cet événement n'est pas mis en avant"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateFeatured(selectedExperience, !selectedExperience.isFeatured)}
                  disabled={!selectedExperience.isFeatured && hasFeatured}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedExperience.isFeatured
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : hasFeatured
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-primary-gold text-black hover:bg-primary-gold-dark"
                  }`}
                >
                  {selectedExperience.isFeatured ? "Retirer" : "Mettre en avant"}
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-playfair mb-3">À propos de l'événement</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedExperience.description}</p>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedExperience(null)}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-secondary-black rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white font-playfair">Nouvel Événement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Image de couverture</label>
                <div
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? "border-primary-gold/50 bg-primary-gold/5"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">Cliquez pour ajouter une image</span>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Titre de l'événement</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Soirée Jazz au Rooftop"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50"
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => !hasFeatured && setIsFeatured(!isFeatured)}
                  disabled={hasFeatured}
                  className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                    isFeatured
                      ? "bg-primary-gold border-primary-gold text-black"
                      : hasFeatured
                        ? "border-white/10 cursor-not-allowed bg-white/5"
                        : "border-white/20 text-transparent hover:border-white/40"
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
                <div
                  className={`flex flex-col cursor-pointer select-none ${hasFeatured ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={() => !hasFeatured && setIsFeatured(!isFeatured)}
                >
                  <label className="text-sm font-medium text-white cursor-pointer">Mettre en avant sur l'accueil</label>
                  {hasFeatured && <span className="text-xs text-red-400">Une autre expérience est déjà mise en avant</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50 scheme-dark"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails de l'événement..."
                  rows={4}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50 resize-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-gold text-black font-bold hover:bg-primary-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Publier l'événement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

