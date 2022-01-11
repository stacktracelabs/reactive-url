import {QueryParams, RawQuery, SearchParams} from "../index";

class TestParams implements SearchParams {

    constructor(protected source: RawQuery) {}

    delete(key: string): void {
        delete this.source[key]
    }

    formatToString(): string {
        return this.keys().reduce((acc: Array<string>, key: string) => {
            acc.push(`${key}=${this.get(key)}`)
            return acc
        }, []).join('&');
    }

    get(key: string): any {
        return this.source[key]
    }

    has(key: string): boolean {
        return this.source.hasOwnProperty(key);
    }

    keys(): Array<string> {
        return Object.keys(this.source)
    }

    set(key: string, value: any): void {
        this.source[key] = value
    }
}

function createQueryParams(filterKeys: Array<string> = [], source: RawQuery = {}): QueryParams {
    return new QueryParams(new TestParams(source), filterKeys)
}

test('Query Params', () => {
    const params = createQueryParams()
    params.set('test', 'value')

    expect(params.get('test')).toBe('value')
})
