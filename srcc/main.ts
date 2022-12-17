import Express from './frameworks/express/express';
import Routes from './routes';
import Config from './config';
import EratePostgresDataAccessor from './databases/postgres/erate/erate-db-accessor';

main();

async function main() {
    const express = new Express();
    const config = new Config();
    const routes = new Routes(express.getRouter());
    const port = config.get('port');

    routes.addAllPaths();
    await EratePostgresDataAccessor.initialize();

    // TODO: Turn function to class and handle
    [...new Set(process.argv)].forEach((value) => {
        if (value === '-p') {
            // TODO: Populate database
        }
    });

    express.listen(port, () => {});
}
