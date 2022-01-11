export interface SearchParams {
    set(key: string, value: any): void
    get(key: string): any
    delete(key: string): void
    has(key: string): boolean
    keys(): Array<string>
    formatToString(): string
}

export class UrlSearchParams implements SearchParams {

    constructor(protected params: URLSearchParams) { }

    delete(key: string): void {
        this.params.delete(key)
    }

    formatToString(): string {
        return this.params.toString();
    }

    get(key: string): any {
        return this.params.get(key)
    }

    has(key: string): boolean {
        return this.params.has(key);
    }

    keys(): Array<string> {
        // @ts-ignore
        return Array.from(this.params.keys());
    }

    set(key: string, value: any): void {
        this.params.set(key, value)
    }

}

export class QueryParams {

    constructor(
        protected urlParams: SearchParams,
        protected filterKeys: Array<string> = []
    ) { }

    clone(): QueryParams {
        return new QueryParams(
            this.urlParams, this.filterKeys.map(it => it)
        )
    }

    fill(data: { [key: string]: any }): QueryParams {
        Object.keys(data).forEach(key => {
            const value = data[key]

            if (value == null || value === '') {
                this.forget(key)
            } else {
                this.set(key, value)
            }
        })

        return this
    }

    setIf(truthy: boolean, key: string, value: any): QueryParams {
        if (truthy) {
            return this.set(key, value)
        } else {
            return this.forget(key)
        }
    }

    setUnless(truthy: boolean, key: string, value: any): QueryParams {
        return this.setIf(! truthy, key, value)
    }

    setFilter(key: string, value: any): QueryParams {
        return this.set(`filter[${key}]`, value)
    }

    forgetFilter(key: string): QueryParams {
        return this.forget(`filter[${key}]`)
    }

    set(key: string, value: any): QueryParams {
        this.urlParams.set(this.keyOf(key), value)

        return this
    }

    get(key: string, defaultValue: any|null = null): any {
        if (this.has(key)) {
            return this.urlParams.get(this.keyOf(key));
        }

        return defaultValue
    }

    forget(key: string): QueryParams {
        this.urlParams.delete(this.keyOf(key))

        return this
    }

    except(key: string): QueryParams {
        return this.forget(key)
    }

    exceptPaginator(): QueryParams {
        return this.except('limit').except('page')
    }

    has(key: string): boolean {
        return this.urlParams.has(this.keyOf(key))
    }

    keys(): Array<string> {
        return this.urlParams.keys()
    }

    appendToUrl(url: string): string {
        if (this.keys().length > 0) {
            return `${url}?${this.toString()}`
        }

        return url
    }

    protected keyOf(key: string) {
        if (this.filterKeys.includes(key)) {
            return `filter[${key}]`
        }

        return key
    }

    toString() {
        return this.urlParams.formatToString()
    }

}

export type RawQuery = { [key: string]: any }
export type QueryChangeCallback = (query: RawQuery) => void

export class ReactiveUrl {

    protected reservedFieldNames: Array<string> = []

    constructor(
        protected filterable: RawQuery,
        protected query: QueryParams,
        protected onChange: QueryChangeCallback|null = null,
    ) {
        Object.keys(filterable).forEach(key => {
            this.registerField(key, filterable[key])
        })

        return new Proxy(this, {
            set(filter: ReactiveUrl & RawQuery, prop: string, value: any) {
                filter[prop] = value

                if (typeof filter.onChange === 'function') {
                    filter.onChange(filter.createQuery())
                }

                return true
            }
        })
    }

    createQuery(): RawQuery {
        return this.reservedFieldNames.reduce((query: RawQuery, field: string) => {
            query[field] = (this as ReactiveUrl & RawQuery)[field]

            return query
        }, {})
    }

    getQueryParams(): QueryParams {
        return this.query.clone()
    }

    getDefaultValue(key: string, defaultValue: any|null = null): any {
        if (this.filterable.hasOwnProperty(key)) {
            return this.filterable[key]
        }

        return defaultValue
    }

    registerField(key: string, defaultValue: any) {
        this.reservedFieldNames.push(key);

        (this as ReactiveUrl & RawQuery)[key] = this.query.get(key, defaultValue);
    }

}

/**
 * Creates instance of ReactiveUrl.
 * 
 * @param filterable
 * @param onQueryChange
 * @param filterKeys
 */
export const createReactiveUrl = (
    filterable: RawQuery,
    onQueryChange: QueryChangeCallback,
    filterKeys: Array<string>|null = null
) => {
    return new ReactiveUrl(
        filterable,
        new QueryParams(
            new UrlSearchParams(new URLSearchParams(window.location.search)),
            filterKeys === null ? Object.keys(filterable) : filterKeys
        ),
    )
}

export class Debounce<T> {
    protected activeTimeout: any = null

    constructor(
        protected callback: (value: T) => void,
        protected  debounceTime = 300
    ) {}

    change(value: T) {
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
            this.activeTimeout = null;
        }

        this.activeTimeout = setTimeout(() => {
            this.callback(value);
        }, this.debounceTime);
    }
}
