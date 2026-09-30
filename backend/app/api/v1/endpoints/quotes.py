import random
from fastapi import APIRouter
from pydantic import BaseModel
import httpx

router = APIRouter()


class QuoteResponse(BaseModel):
    quote: str
    author: str


FRENCH_QUOTES = [
    {"quote": "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.", "author": "Winston Churchill"},
    {"quote": "Ceux qui pensent que c'est impossible sont priés de ne pas déranger ceux qui essaient.", "author": "Proverbe"},
    {"quote": "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", "author": "Sénèque"},
    {"quote": "Dans vingt ans, vous serez plus déçu par les choses que vous n'avez pas faites que par celles que vous avez faites.", "author": "Mark Twain"},
    {"quote": "La plus grande gloire n'est pas de ne jamais tomber, mais de se relever à chaque chute.", "author": "Confucius"},
    {"quote": "Fais de ta vie un rêve, et d'un rêve, une réalité.", "author": "Antoine de Saint-Exupéry"},
    {"quote": "Un objectif sans plan n'est qu'un souhait.", "author": "Antoine de Saint-Exupéry"},
    {"quote": "La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", "author": "Albert Einstein"},
    {"quote": "On ne résout pas un problème avec les modes de pensée qui l'ont engendré.", "author": "Albert Einstein"},
    {"quote": "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment, c'est maintenant.", "author": "Proverbe"},
    {"quote": "Il n'y a qu'une seule façon d'échouer, c'est d'abandonner avant d'avoir réussi.", "author": "Olivier Lockert"},
    {"quote": "La seule façon de faire du bon travail, c'est d'aimer ce que vous faites.", "author": "Steve Jobs"},
    {"quote": "Chaque grande difficulté porte en elle sa propre solution.", "author": "Bouddha"},
    {"quote": "Rien de grand ne s'est accompli dans le monde sans passion.", "author": "Hegel"},
    {"quote": "L'obstination est le chemin de la réussite.", "author": "Charlie Chaplin"},
    {"quote": "Il n'y a point de génie sans un grain de folie.", "author": "Aristote"},
    {"quote": "La logique vous mènera d'un point A à un point B. L'imagination vous mènera partout.", "author": "Albert Einstein"},
    {"quote": "Le secret pour avancer, c'est de commencer.", "author": "Mark Twain"},
    {"quote": "Ne jugez pas chaque journée par votre récolte, mais par les graines que vous avez semées.", "author": "Robert Louis Stevenson"},
    {"quote": "Ce que l'on conçoit bien s'énonce clairement, et les mots pour le dire arrivent aisément.", "author": "Nicolas Boileau"},
    {"quote": "Si vous voulez aller vite, marchez seul. Mais si vous voulez aller loin, marchons ensemble.", "author": "Proverbe africain"},
    {"quote": "Il n'y a pas de vent favorable pour celui qui ne sait pas où il va.", "author": "Sénèque"},
    {"quote": "Ce n'est pas le vent qui décide de votre destination, c'est l'orientation que vous donnez à vos voiles.", "author": "Jim Rohn"},
    {"quote": "Mieux vaut allumer une bougie que maudire les ténèbres.", "author": "Lao-Tseu"},
]


@router.get("/random", response_model=QuoteResponse)
async def get_random_quote() -> QuoteResponse:
    """
    @brief Fetches a quote from an external API with a short timeout and falls back to a random built-in French quote.
    @return A QuoteResponse containing a quote text and its author.
    """
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get("https://api.devisubox.com/quote", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                if "quote" in data and "author" in data:
                    return QuoteResponse(quote=data["quote"], author=data["author"])
    except Exception:
        pass

    selected = random.choice(FRENCH_QUOTES)
    return QuoteResponse(quote=selected["quote"], author=selected["author"])
