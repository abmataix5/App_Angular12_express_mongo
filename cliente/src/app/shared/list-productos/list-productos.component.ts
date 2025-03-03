import { Component, Input, OnInit , ChangeDetectorRef} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoService,Producto,Filter,Categoria} from '../../core';
import { NgxPaginationModule } from 'ngx-pagination';
import { LiteralPrimitive } from '@angular/compiler';
import { FilterProductosComponent } from '..';
import { ValueConverter } from '@angular/compiler/src/render3/view/template';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-list-productos',
  templateUrl: './list-productos.component.html',
  styleUrls: ['./list-productos.component.css']
})

export class ListProductosComponent implements OnInit {

  constructor( 
    private aRouter: ActivatedRoute,
    private _productoService: ProductoService,
    private _location: Location,
    private cd: ChangeDetectorRef
    ) 
    {
      this.id_search = this.aRouter.snapshot.paramMap.get('search'); // cogemos la search de la URL
      this.id_catego = this.aRouter.snapshot.paramMap.get('nombre_catego'); // cogemos la categora de la URL
      
    }
    
  listProductos: Producto[] = [];
  listProductos2: Producto[] = [];
  id_catego : any;
  id_search : string | null;
  filters : Filter = new Filter;
  user_active : any;
  page :number = 1;     // por defecto nos situamos en la primera pagina.
  limit :number = 4;    //numero de produtos que mostramos
  offset:number = 0;   // offset por defecto, nos muestra los primeros productos.
  stateFilter:Boolean = false;
  count = 0;
  controler:boolean=false;

  @Input() 
  set config (config : Filter){
  
    this.filters=config;
    this.controler=true;
    
    if(config){
      this.user_active = true;
    }
  }

 


  ngOnInit(): void {
    this.controler?this.getProductos():this.getFilteredProducts(this.filters); //discrimina list/desde shop || list/desde profile
  }

  getRequestParams(limit: number, offset: number, page:number): any {
    let params: any = {};
    if(page){
      offset=(page-1)*limit;        //definimos valor offset respecto pagina en la que nos encontramos.
      this.filters.offset=offset;
    }else{
      this.filters.offset=0;
    }

    if (limit) {
      params[`limit`] = limit;
      this.filters.limit=limit;
    }

    if (offset) {
      params[`offset`] = offset;
      this.filters.offset=offset;
    }
    return params;
  }


  async getProductos() {   // discrimina id_categoria -> from home ||id_serch -> from header-search || FILTROS shop || list shop normal.
                           // Menos el caso del list. El resto se tratan en una variable global this.filters con su correspondiente modelo.

     const params = await(this.getRequestParams(this.limit, this.offset, this.page));

        if(this.id_catego){ // categoria desde home por paramMap.
       
          this.filters.categoria = this.id_catego;
          this._location.replaceState('/shop/'+this.id_catego);   
          this.getFilteredProducts(this.filters);
          
        }else if(this.id_search){ // search desde el header por paramMap.
        
          this.filters.search = this.id_search;
          this._location.replaceState('/shop/'+this.id_search);
          this.getFilteredProducts(this.filters);
          
          //FILTROS GENERAL
        }else if(this.filters.categoria || this.filters.estado || this.filters.ubicacion || this.filters.favorited || this.filters.author){ 
          this.getFilteredProducts(this.filters);

        }else{ // Shop desde page SHOP. List normal
          this._productoService.getProductos(params).subscribe(

            (data) => {

              this.listProductos = data.productos; //array de productos
              this.count=data.totalProductos;     // numero paginaciones
            },
              (error) => {
        
              console.log(error);
                }
          ); 
        }

  }//end_getProductos()


  // getCategoria(){ // se ha unificado con Filters.

  //   this._productoService.getProducto_catego(this.id_catego).subscribe(
  //     (data2) => {
      
  //       this.listProductos = data2; 
  //     },
  //     (error) => {
      
  //       console.log(error);
  //     }
  //   );
  // }//end_getCategoria

  // getSearch(){  // se ha unificado con Filters

  //   this._productoService.getProducto_search(this.id_search).subscribe(
  //     (data) => {

  //       this.listProductos =data;
  //     },
  //     (error) => {
      
  //       console.log(error);
  //     }
  //   );
  // }//end_getSearch

  getFilteredProducts(filters:Filter){  //filtros


    this.controler=false; // reset variable.

    if(this.id_catego){
      filters.categoria = this.id_catego;
      this._location.replaceState('/shop');
    }
    if(this.id_search){
      filters.search = this.id_search;
      this._location.replaceState('/shop');
    }

    if((this.id_catego == undefined)&&(filters.categoria !== undefined)){
      this.filters.categoria = filters.categoria;
    }
    if((this.id_search == undefined)&&(filters.search !== undefined)){
      this.filters.search = filters.search;
    }
     if((this.id_search == undefined)&&(filters.search !== undefined)){
      this.filters.search = filters.search;
    }

    if((this.filters.favorited !== undefined)){
      this.filters.favorited = filters.favorited;
    }

    if((this.filters.author == undefined)&&(filters.author !== undefined)){
      this.filters.author = filters.author;
    }

      
    this._productoService. getProducto_filter(filters).subscribe(
      (data) => {
        // console.log("**** RESPUESTA SERVER FILTROS *************");
        // console.log(data); 

          if(data.value.stateFilter == true){ //cuando se aplica un nuevo filtro, reseteamos la paginación. page=1
            this.page = 1;
            this.filters.stateFilter=false; // desactivamos filtro nuevo y permite paginacion.
          }

          if(data.value.estado != undefined){
            this.filters.estado = data.value.estado;
          }
          
          if(data.value.categoria != undefined){
            this.filters.categoria = data.value.categoria;
          }

          if(data.value.ubicacion != undefined){
            this.filters.ubicacion = data.value.ubicacion;
          }
          if(data.value.search != undefined){
            this.filters.search = data.value.search;
          }
          if(data.value.favorited != undefined){
            this.filters.favorited = data.value.favorited;
          }
          if(data.value.author != undefined){
            this.filters.author = data.value.author;
          }

          this.listProductos = data.productos; //array de productos filtrados.
          this.count=data.totalProductos;     // numero paginaciones
          this.cd.markForCheck();             //recargamos pagina.
      },
      (error) => {
      
        console.log(error);
      }
    );

  }

  //cada vez que se ejecute el evento changePage lanza getProductos.

  handlePageChange(event:number):void{
    this.page = event;
    console.log("valor event"+ event);
    this.getProductos();
  
  }

}