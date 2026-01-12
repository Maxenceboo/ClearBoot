import {
    ClearBoot, Controller, Injectable, inject, Validate,
    Get, Put, Body, Query, Param
} from '../lib/index';

@Injectable()
class DataService {
    getData(type: string, val: any) { return { type, value: val }; }
}

@Controller('/items')
class AmbiguousController {
    readonly service = inject(DataService);

    // 1. Route Numérique (:id composé de chiffres)
    @Get('/:id(\\d+)')
    getById(@Param('id') id: string) {
        return this.service.getData("NUMERIQUE", Number(id));
    }

    // 2. Route Alphabétique (:type composé de lettres)
    @Get('/:type([a-z]+)')
    getByType(@Param('type') type: string) {
        return this.service.getData("TEXTE", type.toUpperCase());
    }

    // 3. Mélange Complet
    // URL: PUT /items/42/update?silent=true
    @Put('/:id/update')
    updateComplex(
        @Param('id') id: string,     // @Dyn('id')
        @Query('silent') s: string,  // @Query('silent')
        @Body() data: any            // @Body (tout le json)
    ) {
        return {
            status: "Updated",
            target: id,
            silentMode: s === 'true',
            payload: data
        };
    }

    // 4. Test de priorité (Order)
    // Même si 'z' match la regex [a-z]+ ci-dessus,
    // cette route statique passe avant car l'ordre des regex est > 0 implicitement si définies après,
    // ou on peut jouer avec le paramètre order.
    // Ici, '/items/special' est statique, donc matchPath le prendra avant les regex.
    @Get('/special')
    getSpecial() {
        return { type: "SPECIAL", val: "Route Statique" };
    }
}

ClearBoot.create({ port: 5000 });