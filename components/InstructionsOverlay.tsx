'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function InstructionsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-80 z-50 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
        title="Voir les instructions"
      >
        ?
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background border-primary/30">
            <div className="p-8">
              {/* Header */}
              <div className="mb-8 border-b border-primary/20 pb-6">
                <h2 className="text-3xl font-bold text-primary mb-2">Guide d'Utilisation</h2>
                <p className="text-sm text-muted-foreground">Apprenez à explorer le labyrinthe et comparer les algorithmes</p>
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                {/* Section 1: Objective */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">L'Objectif du Projet</h3>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    Ce visualiseur compare trois algorithmes de recherche de chemin dans un labyrinthe 3D interactif. Chaque algorithme a une stratégie différente pour trouver la sortie.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Observez les chemins différents empruntés par chaque algorithme</li>
                    <li>• Comparez leur efficacité en termes de longueur et de complexité</li>
                    <li>• Expérimentez avec différentes tailles de labyrinthe</li>
                  </ul>
                </div>

                {/* Section 2: Controls */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Contrôles 3D</h3>
                  <div className="space-y-2 text-sm text-foreground">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-primary min-w-32">Rotation</span>
                      <span className="text-muted-foreground">Cliquez et glissez avec la souris</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-primary min-w-32">Zoom</span>
                      <span className="text-muted-foreground">Utilisez la molette de la souris</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-primary min-w-32">Déplacement</span>
                      <span className="text-muted-foreground">Cmd/Ctrl + Glissez</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Algorithms */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Les Trois Algorithmes</h3>
                  <div className="space-y-3">
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded">
                      <div className="font-semibold text-red-400 mb-1">BFS - Le Plus Court</div>
                      <p className="text-xs text-muted-foreground">
                        Parcours en largeur. Garantit le chemin le plus court. Explore de manière systématique en largeur.
                      </p>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded">
                      <div className="font-semibold text-blue-400 mb-1">DFS - L'Explorateur</div>
                      <p className="text-xs text-muted-foreground">
                        Parcours en profondeur. Explore les branches profondément avant de revenir. Souvent plus long.
                      </p>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 p-4 rounded">
                      <div className="font-semibold text-green-400 mb-1">Glouton - L'Agressif</div>
                      <p className="text-xs text-muted-foreground">
                        Heuristique orientée but. Approche directe basée sur la proximité de la cible. Rapide mais pas toujours optimal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Comprendre les Métriques</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><span className="font-semibold text-foreground">Longueur du Chemin:</span> Nombre de cellules parcourues</p>
                    <p><span className="font-semibold text-foreground">Virages:</span> Nombre de changements de direction</p>
                    <p><span className="font-semibold text-foreground">Efficacité:</span> Ratio entre chemin optimal et chemin réel</p>
                    <p><span className="font-semibold text-foreground">Rectitude:</span> À quel point le chemin est droit (0-100%)</p>
                    <p><span className="font-semibold text-foreground">Exploration:</span> Pourcentage des cellules visitées</p>
                  </div>
                </div>

                {/* Section 5: Tips */}
                <div className="bg-primary/10 border border-primary/20 p-4 rounded">
                  <h4 className="font-semibold text-primary mb-2">Conseils</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Générez plusieurs labyrinthes pour voir les différences</li>
                    <li>• Essayez des tailles différentes (petites vs grandes)</li>
                    <li>• Comparez les métriques entre les algorithmes</li>
                    <li>• Observez comment chaque algo s'adapte à la forme du labyrinthe</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-primary/20 flex justify-end">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
